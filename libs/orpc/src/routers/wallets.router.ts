import { createWallet } from "../procedures/wallets/createWallet.procedure";
import { deleteWallet } from "../procedures/wallets/deleteWallet.procedure";
import { getWalletById } from "../procedures/wallets/getWalletById.procedure";
import { listWallets } from "../procedures/wallets/listWallets.procedure";
import { updateWallet } from "../procedures/wallets/updateWallet.procedure";

export const walletsRouter = {
  createWallet,
  deleteWallet,
  getWalletById,
  listWallets,
  updateWallet,
};

export type WalletsRouter = typeof walletsRouter;
