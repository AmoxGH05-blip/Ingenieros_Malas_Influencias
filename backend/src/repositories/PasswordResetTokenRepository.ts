import { MoreThan } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { PasswordResetToken } from "../entities";

export const PasswordResetTokenRepository = AppDataSource.getRepository(PasswordResetToken).extend({
  findValidByHash(tokenHash: string) {
    return this.findOneBy({
      tokenHash,
      usado: false,
      fechaExpiracion: MoreThan(new Date()),
    });
  },
});
