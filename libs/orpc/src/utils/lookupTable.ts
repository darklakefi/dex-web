import {
  type AddressLookupTableAccount,
  type Connection,
  PublicKey,
} from "@solana/web3.js";

const DEVNET_LOOKUP = new PublicKey(
  "fUT5cRYT7RTS4kSq7ZpPwqaH7E68soubbutFxYHeNjo",
);
const MAINNET_LOOKUP = new PublicKey(
  "2h3Sz2G84TcrqWc3FAyRZjjf5aCExMKM5sG3fh1bBXSg",
);

export async function getOptionalLookupTable(
  connection: Connection,
): Promise<AddressLookupTableAccount | undefined> {
  const lutAddress =
    process.env.NEXT_PUBLIC_NETWORK === "2" ? DEVNET_LOOKUP : MAINNET_LOOKUP;

  try {
    const { value } = await connection.getAddressLookupTable(lutAddress);
    return value ?? undefined;
  } catch {
    return undefined;
  }
}
