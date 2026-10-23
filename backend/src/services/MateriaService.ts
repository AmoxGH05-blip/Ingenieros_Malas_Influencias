import { MateriaRepository } from "../repositories/MateriaRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { ConflictoError, DatosInvalidosError, esViolacionDeUnicidad } from "../utils/errores";
import { Actor, exigirGestor } from "../utils/permisos";
import { entero, enteroEnRango, texto } from "../utils/validaciones";

export interface NuevaMateriaInput {
  programaEducativoId?: unknown;
  clave?: unknown;
  nombre?: unknown;
  creditos?: unknown;
}

export interface MateriaDTO {
  id: number;
  programaEducativoId: number;
  clave: string;
  nombre: string;
  creditos: number;
}

const CLAVE_REGEX = /^[A-Z0-9][A-Z0-9._-]{0,19}$/;
const CREDITOS_MAXIMOS = 100;

export const MateriaService = {
  async crear(actor: Actor, input: NuevaMateriaInput): Promise<MateriaDTO> {
    exigirGestor(actor);
    const programaEducativoId = entero(input.programaEducativoId, "programaEducativoId");
    const clave = texto(input.clave, "clave", 20)!.toUpperCase();
    if (!CLAVE_REGEX.test(clave)) {
      throw new DatosInvalidosError("clave solo puede tener letras, numeros, punto, guion y guion bajo, sin espacios");
    }
    const nombre = texto(input.nombre, "nombre", 150)!;
    const creditos = enteroEnRango(input.creditos, "creditos", 0, CREDITOS_MAXIMOS, 0);

    if (!(await ProgramaEducativoRepository.findById(programaEducativoId))) {
      throw new DatosInvalidosError("programa educativo no existe");
    }
    if (await MateriaRepository.findOneBy({ clave })) {
      throw new ConflictoError("Ya existe una materia con esa clave");
    }

    const guardada = await MateriaRepository.save(MateriaRepository.create({ programaEducativoId, clave, nombre, creditos })).catch(
      (error: unknown) => {
        // Dos altas simultaneas con la misma clave: gana una y la otra recibe un conflicto, no un 500.
        if (esViolacionDeUnicidad(error)) throw new ConflictoError("Ya existe una materia con esa clave");
        throw error;
      }
    );
    return { id: guardada.id, programaEducativoId, clave, nombre, creditos };
  },
};
