import { updateWalletHandler } from "../../handlers/wallets/wallets.handler";
import { updateWalletInputSchema } from "../../schemas/wallets/wallets.schema";
import { baseProcedure } from "../base.procedure";

export const updateWallet = baseProcedure
  .input(updateWalletInputSchema)
  .handler(async ({ input }) => {
    return await updateWalletHandler(input);
  });
