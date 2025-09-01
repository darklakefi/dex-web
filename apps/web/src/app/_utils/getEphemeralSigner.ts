import type { Wallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";

/**
 * Gets an ephemeral signer for SquadsX or fallback Keypair for other wallets
 * @param wallet - The connected wallet
 * @param count - Number of ephemeral signers needed (default: 1)
 * @returns Promise<{ publicKey: PublicKey, keypair?: Keypair }>
 */
export async function getEphemeralSigner(
  wallet: Wallet | null | undefined,
  count = 1,
): Promise<{ publicKey: PublicKey; keypair?: Keypair }> {
  // Check if connected wallet is SquadsX
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
