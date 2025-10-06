export const SOL_MINT = "So11111111111111111111111111111111111111111";
export const WSOL_MINT = "So11111111111111111111111111111111111111112";

export function replaceSolWithWsol(
  addrA: string,
  addrB: string,
): { tokenAAddress: string; tokenBAddress: string } {
  if (addrA === SOL_MINT) {
    return { tokenAAddress: WSOL_MINT, tokenBAddress: addrB };
  }
  if (addrB === SOL_MINT) {
    return { tokenAAddress: addrA, tokenBAddress: WSOL_MINT };
  }
  return { tokenAAddress: addrA, tokenBAddress: addrB };
}
