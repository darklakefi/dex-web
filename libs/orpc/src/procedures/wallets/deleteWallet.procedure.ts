import { z } from "zod";
import { deleteWalletHandler } from "../../handlers/wallets/wallets.handler";
import { baseProcedure } from "../base.procedure";

export const deleteWallet = baseProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return await deleteWalletHandler(input.id);
  });
