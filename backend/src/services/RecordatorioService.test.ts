import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/PeriodoEvaluacionRepository", () => ({
  PeriodoEvaluacionRepository: { find: vi.fn() },
}));
vi.mock("../repositories/GrupoRepository", () => ({
  GrupoRepository: { find: vi.fn() },
}));
vi.mock("../repositories/MateriaRepository", () => ({
  MateriaRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/InscripcionRepository", () => ({
  InscripcionRepository: { find: vi.fn() },
}));
vi.mock("../repositories/EstudianteRepository", () => ({
  EstudianteRepository: { find: vi.fn() },
}));
vi.mock("../repositories/UsuarioRepository", () => ({
  UsuarioRepository: { find: vi.fn() },
}));
vi.mock("../repositories/EvaluacionRepository", () => ({
  EvaluacionRepository: { find: vi.fn() },
}));
vi.mock("../repositories/EnvioRecordatorioRepository", () => ({
  EnvioRecordatorioRepository: { find: vi.fn(), reservar: vi.fn(), liberar: vi.fn() },
}));
vi.mock("./EmailService", () => ({
  EmailService: { enviarRecordatorioEvaluacion: vi.fn() },
}));

import { RecordatorioService, diasRestantes, umbralDeAviso } from "./RecordatorioService";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { GrupoRepository } from "../repositories/GrupoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { InscripcionRepository } from "../repositories/InscripcionRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { EvaluacionRepository } from "../repositories/EvaluacionRepository";
import { EnvioRecordatorioRepository } from "../repositories/EnvioRecordatorioRepository";
import { EmailService } from "./EmailService";

const DIA_MS = 24 * 60 * 60 * 1000;
const AHORA = new Date("2026-11-10T15:00:00Z");
const enDias = (dias: number) => new Date(AHORA.getTime() + dias * DIA_MS - 60_000);

const periodo = (fechaFin: Date) => ({
  id: 5,
  nombre: "Evaluacion 2026-1",
  periodoAcademicoId: 1,
  fechaInicio: new Date(AHORA.getTime() - 20 * DIA_MS),
  fechaFin,
  activo: true,
});

const GRUPO_A = { id: 10, materiaId: 1, docenteId: 1, periodoAcademicoId: 1, seccion: "3A" };
const GRUPO_B = { id: 11, materiaId: 2, docenteId: 2, periodoAcademicoId: 1, seccion: "3A" };
const GRUPO_OTRO_CICLO = { id: 99, materiaId: 1, docenteId: 1, periodoAcademicoId: 2, seccion: "1A" };

// Alumno 1 (usuario 101): debe 2 materias. Alumno 2 (usuario 102): completo todo. Alumno 3 (usuario 103): debe 1.
const ESTUDIANTES = [
  { id: 1, usuarioId: 101, nombre: "Ana" },
  { id: 2, usuarioId: 102, nombre: "Beto" },
  { id: 3, usuarioId: 103, nombre: "Carla" },
];
const USUARIOS = [
  { id: 101, correoElectronico: "ana@x.mx", activo: true },
  { id: 102, correoElectronico: "beto@x.mx", activo: true },
  { id: 103, correoElectronico: "carla@x.mx", activo: true },
];
const INSCRIPCIONES = [
  { estudianteId: 1, grupoId: 10 },
  { estudianteId: 1, grupoId: 11 },
  { estudianteId: 2, grupoId: 10 },
  { estudianteId: 2, grupoId: 11 },
  { estudianteId: 3, grupoId: 10 },
  { estudianteId: 3, grupoId: 99 }, // otro ciclo: no cuenta
];
const COMPLETADAS = [
  { estudianteId: 2, grupoId: 10 },
  { estudianteId: 2, grupoId: 11 },
  { estudianteId: 3, grupoId: 99 }, // otro ciclo: no cuenta
];

function prepararDatos(fechaFin: Date) {
  vi.mocked(PeriodoEvaluacionRepository.find).mockResolvedValue([periodo(fechaFin)] as never);
  vi.mocked(GrupoRepository.find).mockResolvedValue([GRUPO_A, GRUPO_B, GRUPO_OTRO_CICLO] as never);
  vi.mocked(InscripcionRepository.find).mockResolvedValue(INSCRIPCIONES as never);
  vi.mocked(EvaluacionRepository.find).mockResolvedValue(COMPLETADAS as never);
  vi.mocked(EstudianteRepository.find).mockResolvedValue(ESTUDIANTES as never);
  vi.mocked(UsuarioRepository.find).mockResolvedValue(USUARIOS as never);
  vi.mocked(MateriaRepository.findByIds).mockResolvedValue([
    { id: 1, nombre: "Base de Datos" },
    { id: 2, nombre: "Redes" },
  ] as never);
  vi.mocked(DocenteRepository.findByIds).mockResolvedValue([
    { id: 1, nombre: "Luis", apellidoPaterno: "Perez" },
    { id: 2, nombre: "Rosa", apellidoPaterno: "Gomez" },
  ] as never);
  vi.mocked(EnvioRecordatorioRepository.find).mockResolvedValue([] as never);
  vi.mocked(EnvioRecordatorioRepository.reservar).mockResolvedValue(true);
  vi.mocked(EnvioRecordatorioRepository.liberar).mockResolvedValue(undefined as never);
  vi.mocked(EmailService.enviarRecordatorioEvaluacion).mockResolvedValue(undefined);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("diasRestantes / umbralDeAviso", () => {
  it("redondea hacia arriba los dias que faltan", () => {
    expect(diasRestantes(AHORA, enDias(3))).toBe(3);
    expect(diasRestantes(AHORA, new Date(AHORA.getTime() + 2.2 * DIA_MS))).toBe(3);
  });

  it("devuelve el umbral mas chico que cubre los dias restantes", () => {
    expect(umbralDeAviso(8)).toBeNull();
    expect(umbralDeAviso(7)).toBe(7);
    expect(umbralDeAviso(5)).toBe(7);
    expect(umbralDeAviso(3)).toBe(3);
    expect(umbralDeAviso(2)).toBe(3);
    expect(umbralDeAviso(1)).toBe(1);
  });

  it("no hay aviso cuando ya cerro", () => {
    expect(umbralDeAviso(0)).toBeNull();
    expect(umbralDeAviso(-2)).toBeNull();
  });
});

describe("RecordatorioService.ejecutar", () => {
  it("envia solo a quienes tienen evaluaciones pendientes y registra el envio", async () => {
    prepararDatos(enDias(3));

    const resultado = await RecordatorioService.ejecutar({ ahora: AHORA });

    const envio = vi.mocked(EmailService.enviarRecordatorioEvaluacion);
    expect(envio).toHaveBeenCalledTimes(2);
    expect(envio.mock.calls.map((c) => c[0]).sort()).toEqual(["ana@x.mx", "carla@x.mx"]);
    expect(EnvioRecordatorioRepository.reservar).toHaveBeenCalledWith(5, 101, 3);
    expect(EnvioRecordatorioRepository.reservar).toHaveBeenCalledWith(5, 103, 3);
    expect(resultado.periodos[0]).toMatchObject({ periodoId: 5, umbral: 3, enviados: 2, omitidosSinPendientes: 1 });
  });

  it("incluye en el correo las materias pendientes con su docente y los dias restantes", async () => {
    prepararDatos(enDias(3));

    await RecordatorioService.ejecutar({ ahora: AHORA });

    const llamadaAna = vi.mocked(EmailService.enviarRecordatorioEvaluacion).mock.calls.find((c) => c[0] === "ana@x.mx")!;
    expect(llamadaAna[1]).toMatchObject({
      nombre: "Ana",
      diasRestantes: 3,
      pendientes: ["Base de Datos (Perez, Luis)", "Redes (Gomez, Rosa)"],
    });
  });

  it("no envia nada si faltan mas de 7 dias", async () => {
    prepararDatos(enDias(10));

    const resultado = await RecordatorioService.ejecutar({ ahora: AHORA });

    expect(EmailService.enviarRecordatorioEvaluacion).not.toHaveBeenCalled();
    expect(resultado.periodos).toEqual([]);
  });

  it("no envia si el periodo aun no empieza o ya cerro", async () => {
    vi.mocked(PeriodoEvaluacionRepository.find).mockResolvedValue([
      { ...periodo(enDias(3)), fechaInicio: new Date(AHORA.getTime() + DIA_MS) },
      { ...periodo(new Date(AHORA.getTime() - DIA_MS)), id: 6 },
    ] as never);

    const resultado = await RecordatorioService.ejecutar({ ahora: AHORA });

    expect(EmailService.enviarRecordatorioEvaluacion).not.toHaveBeenCalled();
    expect(resultado.periodos).toEqual([]);
  });

  it("no repite el aviso a quien ya lo recibio", async () => {
    prepararDatos(enDias(1));
    vi.mocked(EnvioRecordatorioRepository.find).mockResolvedValue([{ usuarioId: 101 }] as never);

    const resultado = await RecordatorioService.ejecutar({ ahora: AHORA });

    expect(vi.mocked(EmailService.enviarRecordatorioEvaluacion).mock.calls.map((c) => c[0])).toEqual(["carla@x.mx"]);
    expect(resultado.periodos[0]).toMatchObject({ umbral: 1, enviados: 1, omitidosYaEnviado: 1 });
  });

  it("si otra corrida ya reservo el aviso, no lo envia", async () => {
    prepararDatos(enDias(3));
    vi.mocked(EnvioRecordatorioRepository.reservar).mockResolvedValue(false);

    const resultado = await RecordatorioService.ejecutar({ ahora: AHORA });

    expect(EmailService.enviarRecordatorioEvaluacion).not.toHaveBeenCalled();
    expect(resultado.periodos[0]).toMatchObject({ enviados: 0, omitidosYaEnviado: 2 });
  });

  it("cuando el envio falla libera la reserva, reporta el error y sigue con los demas", async () => {
    prepararDatos(enDias(3));
    vi.mocked(EmailService.enviarRecordatorioEvaluacion).mockImplementation(async (destinatario) => {
      if (destinatario === "ana@x.mx") throw new Error("SMTP caido");
    });

    const resultado = await RecordatorioService.ejecutar({ ahora: AHORA });

    expect(EnvioRecordatorioRepository.liberar).toHaveBeenCalledWith(5, 101, 3);
    expect(EnvioRecordatorioRepository.liberar).not.toHaveBeenCalledWith(5, 103, 3);
    expect(resultado.periodos[0]).toMatchObject({
      enviados: 1,
      fallidos: [{ correo: "ana@x.mx", error: "SMTP caido" }],
    });
  });

  it("en modo simulacion lista destinatarios sin enviar ni reservar", async () => {
    prepararDatos(enDias(3));

    const resultado = await RecordatorioService.ejecutar({ ahora: AHORA, simular: true });

    expect(EmailService.enviarRecordatorioEvaluacion).not.toHaveBeenCalled();
    expect(EnvioRecordatorioRepository.reservar).not.toHaveBeenCalled();
    expect(resultado.simulacion).toBe(true);
    expect(resultado.periodos[0].destinatarios.sort()).toEqual(["ana@x.mx", "carla@x.mx"]);
    expect(resultado.periodos[0].enviados).toBe(0);
  });

  it("omite usuarios inactivos", async () => {
    prepararDatos(enDias(3));
    vi.mocked(UsuarioRepository.find).mockResolvedValue(USUARIOS.map((u) => (u.id === 101 ? { ...u, activo: false } : u)) as never);

    await RecordatorioService.ejecutar({ ahora: AHORA });

    expect(vi.mocked(EmailService.enviarRecordatorioEvaluacion).mock.calls.map((c) => c[0])).toEqual(["carla@x.mx"]);
  });
});
