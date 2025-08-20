import { listWalletsHandler } from "../../handlers/wallets/wallets.handler";
import { baseProcedure } from "../base.procedure";

export const listWallets = baseProcedure.handler(async () => {
  return await listWalletsHandler();
});
