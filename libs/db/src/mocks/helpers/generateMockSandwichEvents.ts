import { randNumber, randRecentDate } from "@ngneat/falso";
import type { NewSandwichEvent } from "../../schema/types";
import { generateMockSolanaAddress } from "./generateMockSolanaAddress";
import { generateMockTxHash } from "./generateMockTxHash";

export function generateMockSandwichEvents(
  count: number,
  tokenAddresses: string[],
  slots: bigint[],
): NewSandwichEvent[] {
  const dexes = ["Raydium", "Orca", "Jupiter", "Serum"];

  return Array.from({ length: count }, () => {
    const slot =
      slots.length > 0
        ? (slots[Math.floor(Math.random() * slots.length)] ?? BigInt(0))
        : BigInt(0);
    const token_address =
      tokenAddresses.length > 0
        ? (tokenAddresses[Math.floor(Math.random() * tokenAddresses.length)] ??
          "")
        : "";
    const attacker_address = generateMockSolanaAddress();
    const victim_address = generateMockSolanaAddress();

    return {
      attacker_address,
      dex_name: dexes[Math.floor(Math.random() * dexes.length)] ?? "Raydium",
      lp_address: generateMockSolanaAddress(),
      occurred_at: randRecentDate({ days: 30 }),
      slot,
      sol_amount_drained: BigInt(randNumber({ max: 100000000, min: 1000000 })),
      sol_amount_swap: BigInt(randNumber({ max: 1000000000, min: 10000000 })),
      token_address,
      tx_hash_attacker_buy: generateMockTxHash(),
      tx_hash_attacker_sell: generateMockTxHash(),
      tx_hash_victim_swap: generateMockTxHash(),
      victim_address,
    };
  });
}
