import type { Wallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";

export async function getEphemeralSigner(
  wallet: Wallet | null | undefined,
  count = 1,
): Promise<{ publicKey: PublicKey; keypair?: Keypair }> {
  if (
    wallet?.adapter &&
    "standard" in wallet.adapter &&
    "fuse:getEphemeralSigners" in wallet.adapter.wallet.features
  ) {
    try {
      const ephemeralFeature = wallet.adapter.wallet.features[
        "fuse:getEphemeralSigners"
      ] as { getEphemeralSigners: (count: number) => Promise<string[]> };

      const ephemeralSignerAddresses =
        await ephemeralFeature.getEphemeralSigners(count);

      return {
        keypair: undefined,
        publicKey: new PublicKey(ephemeralSignerAddresses[0]!),
      };
    } catch (error) {
      console.error("Failed to get SquadsX ephemeral signer:", error);
    }
  }

  const keypair = Keypair.generate();
  return {
    keypair,
    publicKey: keypair.publicKey,
  };
}

export function supportsEphemeralSigners(
  wallet: Wallet | null | undefined,
): boolean {
  return !!(
    wallet?.adapter &&
    "standard" in wallet.adapter &&
    "fuse:getEphemeralSigners" in wallet.adapter.wallet.features
  );
}
