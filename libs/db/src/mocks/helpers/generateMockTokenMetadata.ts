import { randAlphaNumeric, randCompanyName, randUrl } from "@ngneat/falso";
import type { NewTokenMetadata } from "../../schema/types";
import { generateMockSolanaAddress } from "./generateMockSolanaAddress";

export function generateMockTokenMetadata(count: number): NewTokenMetadata[] {
  const decimalsOptions = [6, 8, 9];
  return Array.from({ length: count }, () => {
    const randomIndex = Math.floor(Math.random() * decimalsOptions.length);
    const decimals =
      typeof decimalsOptions[randomIndex] === "number"
        ? decimalsOptions[randomIndex]
        : 6;
    return {
      decimals,
      name: `${randCompanyName()} Token`,
      symbol: Array.from({ length: Math.floor(Math.random() * 4) + 3 }, () =>
        randAlphaNumeric(),
      )
        .join("")
        .toUpperCase(),
      token_address: generateMockSolanaAddress(),
      uri: randUrl(),
    };
  });
}
