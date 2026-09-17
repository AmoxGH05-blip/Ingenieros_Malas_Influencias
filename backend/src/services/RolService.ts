import { RolRepository } from "../repositories/RolRepository";

export const RolService = {
  listarRoles() {
    return RolRepository.findAllOrderedByName();
  },
};
