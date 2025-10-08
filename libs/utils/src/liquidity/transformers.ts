import { sortSolanaAddresses } from "../blockchain/sortSolanaAddresses";
import { parseAmount } from "../common/amountUtils";
import { toRawUnitsBigint } from "../common/unitConversion";

export interface AddLiquidityTransformParams {
  tokenAAddress: string;
  tokenBAddress: string;
  tokenAAmount: string;
  tokenBAmount: string;
  slippage: string;
  poolTokenXMint: string;
  tokenXDecimals: number;
  tokenYDecimals: number;
  userAddress: string;
  calculateLpTokens: (amountX: number, amountY: number) => bigint;
}

export interface AddLiquidityPayload {
  tokenMintX: string;
  tokenMintY: string;
  maxAmountX: bigint;
  maxAmountY: bigint;
  amountLp: bigint;
  userAddress: string;
  label: string;
  refCode: string;
}

export function transformToAddLiquidityPayload(
  params: AddLiquidityTransformParams,
): AddLiquidityPayload {
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    params.tokenAAddress,
    params.tokenBAddress,
  );

  const tokenAAmount = parseAmount(params.tokenAAmount);
  const tokenBAmount = parseAmount(params.tokenBAmount);

  const isTokenXSell = params.poolTokenXMint === params.tokenBAddress;
  const baseAmountX = isTokenXSell ? tokenBAmount : tokenAAmount;
  const baseAmountY = isTokenXSell ? tokenAAmount : tokenBAmount;

  const slippageDecimal = parseFloat(params.slippage || "0.5") / 100;
  const slippageFactor = 1 + slippageDecimal;
  const maxAmountX = baseAmountX * slippageFactor;
  const maxAmountY = baseAmountY * slippageFactor;

  const maxAmountXRaw = toRawUnitsBigint(maxAmountX, params.tokenXDecimals);
  const maxAmountYRaw = toRawUnitsBigint(maxAmountY, params.tokenYDecimals);

  const slippageReductionFactor = 1 - slippageDecimal;
  const lpCalcAmountX = baseAmountX * slippageReductionFactor;
  const lpCalcAmountY = baseAmountY * slippageReductionFactor;
  const amountLpRaw = params.calculateLpTokens(lpCalcAmountX, lpCalcAmountY);

  return {
    amountLp: amountLpRaw,
    label: "",
    maxAmountX: maxAmountXRaw,
    maxAmountY: maxAmountYRaw,
    refCode: "",
    tokenMintX: tokenXAddress,
    tokenMintY: tokenYAddress,
    userAddress: params.userAddress,
  };
}
