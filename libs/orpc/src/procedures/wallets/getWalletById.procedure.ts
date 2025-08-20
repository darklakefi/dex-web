import { z } from "zod";
import { getWalletByIdHandler } from "../../handlers/wallets/wallets.handler";
import { baseProcedure } from "../base.procedure";

export const getWalletById = baseProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return await getWalletByIdHandler(input.id);
  });
