import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/PeriodoEvaluacionRepository", () => ({
  PeriodoEvaluacionRepository: { findActivo: vi.fn() },
}));
vi.mock("../repositories/EstudianteRepository", () => ({
  EstudianteRepository: { findByUsuarioId: vi.fn() },
}));
vi.mock("../repositories/InscripcionRepository", () => ({
  InscripcionRepository: { findByEstudianteId: vi.fn() },
}));
vi.mock("../repositories/GrupoRepository", () => ({
  GrupoRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/MateriaRepository", () => ({
  MateriaRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/EvaluacionRepository", () => ({
  EvaluacionRepository: { findByEstudianteAndPeriodo: vi.fn() },
}));

import { NotificacionService } from "./NotificacionService";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { InscripcionRepository } from "../repositories/InscripcionRepository";
import { GrupoRepository } from "../repositories/GrupoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { EvaluacionRepository } from "../repositories/EvaluacionRepository";

const DIA_MS = 24 * 60 * 60 * 1000;
const AHORA = new Date("2026-11-10T15:00:00Z");
const enDias = (dias: number) => new Date(AHORA.getTime() + dias * DIA_MS - 60_000);

const periodo = (fechaFin: Date, extra = {}) => ({
  id: 5,
  nombre: "Evaluacion 2026-1",
  periodoAcademicoId: 1,
  fechaInicio: new Date(AHORA.getTime() - 20 * DIA_MS),
  fechaFin,
  activo: true,
  ...extra,
});

const GRUPOS = [
  { id: 10, materiaId: 1, docenteId: 1, periodoAcademicoId: 1, seccion: "3A" },
  { id: 11, materiaId: 2, docenteId: 2, periodoAcademicoId: 1, seccion: "3A" },
  { id: 99, materiaId: 1, docenteId: 1, periodoAcademicoId: 2, seccion: "1A" }, // otro ciclo
];

function prepararAlumno(fechaFin: Date, completadas: number[] = [], extraPeriodo = {}) {
  vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(periodo(fechaFin, extraPeriodo) as never);
  vi.mocked(EstudianteRepository.findByUsuarioId).mockResolvedValue({ id: 1, usuarioId: 101 } as never);
  vi.mocked(InscripcionRepository.findByEstudianteId).mockResolvedValue([
    { estudianteId: 1, grupoId: 10 },
    { estudianteId: 1, grupoId: 11 },
    { estudianteId: 1, grupoId: 99 },
  ] as never);
  vi.mocked(GrupoRepository.findByIds).mockResolvedValue(GRUPOS as never);
  vi.mocked(MateriaRepository.findByIds).mockResolvedValue([
    { id: 1, nombre: "Base de Datos" },
    { id: 2, nombre: "Redes" },
  ] as never);
  vi.mocked(DocenteRepository.findByIds).mockResolvedValue([
    { id: 1, nombre: "Luis", apellidoPaterno: "Perez" },
    { id: 2, nombre: "Rosa", apellidoPaterno: "Gomez" },
  ] as never);
  vi.mocked(EvaluacionRepository.findByEstudianteAndPeriodo).mockResolvedValue(
    completadas.map((grupoId) => ({ grupoId, completada: true })) as never
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("NotificacionService.obtener (alumno)", () => {
  it("avisa con las materias pendientes cuando faltan 7 dias o menos", async () => {
    prepararAlumno(enDias(5));

    const [aviso] = await NotificacionService.obtener(101, ["Estudiante"], AHORA);

    expect(aviso).toMatchObject({
      tipo: "evaluaciones-pendientes",
      diasRestantes: 5,
      pendientes: ["Base de Datos (Perez, Luis)", "Redes (Gomez, Rosa)"],
      enlace: "/estudiante/evaluaciones",
    });
    expect(aviso.titulo).toBe("Faltan 5 días para cerrar la evaluación docente");
    expect(aviso.mensaje).toContain("2 evaluaciones pendientes");
  });

  it("solo lista lo que falta: no incluye lo ya completado ni grupos de otro ciclo", async () => {
    prepararAlumno(enDias(5), [10]);

    const [aviso] = await NotificacionService.obtener(101, ["Estudiante"], AHORA);

    expect(aviso.pendientes).toEqual(["Redes (Gomez, Rosa)"]);
    expect(aviso.mensaje).toContain("1 evaluación pendiente");
  });

  it("usa singular cuando falta 1 dia", async () => {
    prepararAlumno(enDias(1));

    const [aviso] = await NotificacionService.obtener(101, ["Estudiante"], AHORA);

    expect(aviso.titulo).toBe("Falta 1 día para cerrar la evaluación docente");
  });

  it("avisa con urgencia cuando el cierre es hoy, aunque falten pocas horas", async () => {
    prepararAlumno(new Date("2026-11-11T05:00:00Z")); // 23:00 de hoy en Mexico

    const [aviso] = await NotificacionService.obtener(101, ["Estudiante"], AHORA);

    expect(aviso).toMatchObject({ severidad: "urgente", diasRestantes: 0, titulo: "Hoy cierra la evaluación docente" });
  });

  it("cuenta dias de calendario: el mensaje y la fecha de cierre coinciden", async () => {
    prepararAlumno(new Date("2026-11-18T05:59:00Z")); // cierra el 17-nov a las 23:59 en Mexico

    const [aviso] = await NotificacionService.obtener(101, ["Estudiante"], AHORA);

    expect(aviso.titulo).toBe("Faltan 7 días para cerrar la evaluación docente");
    expect(aviso.mensaje).toContain("17 de noviembre");
  });

  it("la gravedad sube con la cercania del cierre", async () => {
    const gravedad = async (dias: number) => {
      prepararAlumno(enDias(dias));
      return (await NotificacionService.obtener(101, ["Estudiante"], AHORA))[0].severidad;
    };

    expect(await gravedad(7)).toBe("info");
    expect(await gravedad(4)).toBe("info");
    expect(await gravedad(3)).toBe("aviso");
    expect(await gravedad(2)).toBe("aviso");
    expect(await gravedad(1)).toBe("urgente");
  });

  it("no avisa si faltan mas de 7 dias", async () => {
    prepararAlumno(enDias(10));
    expect(await NotificacionService.obtener(101, ["Estudiante"], AHORA)).toEqual([]);
  });

  it("no avisa si ya completo todo", async () => {
    prepararAlumno(enDias(3), [10, 11]);
    expect(await NotificacionService.obtener(101, ["Estudiante"], AHORA)).toEqual([]);
  });

  it("no avisa si el periodo aun no empieza o ya cerro", async () => {
    prepararAlumno(enDias(3), [], { fechaInicio: new Date(AHORA.getTime() + DIA_MS) });
    expect(await NotificacionService.obtener(101, ["Estudiante"], AHORA)).toEqual([]);

    prepararAlumno(new Date(AHORA.getTime() - DIA_MS));
    expect(await NotificacionService.obtener(101, ["Estudiante"], AHORA)).toEqual([]);
  });

  it("no avisa si no hay periodo activo", async () => {
    vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(null as never);
    vi.mocked(EstudianteRepository.findByUsuarioId).mockResolvedValue({ id: 1, usuarioId: 101 } as never);
    expect(await NotificacionService.obtener(101, ["Estudiante"], AHORA)).toEqual([]);
  });

  it("no avisa si la cuenta Estudiante no tiene perfil de estudiante", async () => {
    vi.mocked(EstudianteRepository.findByUsuarioId).mockResolvedValue(null as never);
    expect(await NotificacionService.obtener(101, ["Estudiante"], AHORA)).toEqual([]);
  });

  it("no hace nada para roles que no son alumno", async () => {
    expect(await NotificacionService.obtener(7, ["Docente"], AHORA)).toEqual([]);
    expect(await NotificacionService.obtener(8, ["Coordinador"], AHORA)).toEqual([]);
    expect(EstudianteRepository.findByUsuarioId).not.toHaveBeenCalled();
  });
});
