import { randAlphaNumeric, randCompanyName, randImg } from "@ngneat/falso";
import type { NewToken } from "../../schemas/types";
import { generateMockSolanaAddress } from "./generateMockSolanaAddress";

export function generateMockTokens(count: number): NewToken[] {
  return Array.from({ length: count }, () => ({
    image_url: randImg({
      height: 100,
      width: 100,
    }),
    name: randCompanyName(),
    symbol: Array.from({ length: Math.floor(Math.random() * 4) + 3 }, () =>
      randAlphaNumeric(),
    )
      .join("")
      .toUpperCase(),
    token_address: generateMockSolanaAddress(),
  }));
}
