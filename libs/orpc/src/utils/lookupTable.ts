import type {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
} from "@solana/web3.js";

export async function getOptionalLookupTable(
  connection: Connection,
): Promise<AddressLookupTableAccount | undefined> {
  const lutAddress = process.env.LOOKUP_TABLE_ADDRESS;
  if (!lutAddress) return undefined;
  try {
    const { value } = await connection.getAddressLookupTable(
      new (require("@solana/web3.js").PublicKey)(lutAddress) as PublicKey,
    );
    return value ?? undefined;
  } catch {
    return undefined;
  }
}
