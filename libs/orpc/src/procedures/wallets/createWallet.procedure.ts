import { createWalletHandler } from "../../handlers/wallets/wallets.handler";
import { createWalletInputSchema } from "../../schemas/wallets/wallets.schema";
import { baseProcedure } from "../base.procedure";

export const createWallet = baseProcedure
  .input(createWalletInputSchema)
  .handler(async ({ input }) => {
    return await createWalletHandler(input);
  });
