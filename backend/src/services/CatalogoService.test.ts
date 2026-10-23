import { describe, expect, it, vi } from "vitest";

vi.mock("../repositories/ProgramaEducativoRepository", () => ({ ProgramaEducativoRepository: { find: vi.fn() } }));
vi.mock("../repositories/FacultadRepository", () => ({ FacultadRepository: { find: vi.fn() } }));
vi.mock("../repositories/PeriodoAcademicoRepository", () => ({ PeriodoAcademicoRepository: { find: vi.fn() } }));
vi.mock("../repositories/MateriaRepository", () => ({ MateriaRepository: { find: vi.fn() } }));
vi.mock("../repositories/DocenteRepository", () => ({ DocenteRepository: { find: vi.fn() } }));

import { CatalogoService } from "./CatalogoService";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { FacultadRepository } from "../repositories/FacultadRepository";
import { PeriodoAcademicoRepository } from "../repositories/PeriodoAcademicoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";

describe("CatalogoService.obtener", () => {
  it("junta los catalogos que necesitan las pantallas de altas y grupos", async () => {
    vi.mocked(ProgramaEducativoRepository.find).mockResolvedValue([{ id: 1, nombre: "ISC", nivelEducativo: "Licenciatura" }] as never);
    vi.mocked(FacultadRepository.find).mockResolvedValue([{ id: 2, nombre: "Ingenieria" }] as never);
    vi.mocked(PeriodoAcademicoRepository.find).mockResolvedValue([{ id: 3, nombre: "2026-2027 Semestre 1", activo: true }] as never);
    vi.mocked(MateriaRepository.find).mockResolvedValue([{ id: 4, clave: "BD101", nombre: "Base de Datos", creditos: 6, programaEducativoId: 1 }] as never);
    vi.mocked(DocenteRepository.find).mockResolvedValue([{ id: 5, numeroEmpleado: "EMP1", nombre: "Ana", apellidoPaterno: "Garcia" }] as never);

    expect(await CatalogoService.obtener()).toEqual({
      programasEducativos: [{ id: 1, nombre: "ISC", nivelEducativo: "Licenciatura" }],
      facultades: [{ id: 2, nombre: "Ingenieria" }],
      periodosAcademicos: [{ id: 3, nombre: "2026-2027 Semestre 1", activo: true }],
      materias: [{ id: 4, clave: "BD101", nombre: "Base de Datos", creditos: 6, programaEducativoId: 1 }],
      docentes: [{ id: 5, numeroEmpleado: "EMP1", nombre: "Garcia, Ana" }],
    });
  });
});
