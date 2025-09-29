import { parseAmountBigNumber } from "@dex-web/utils";

export interface CalculationInput {
  type: 'PRICE_CALCULATION' | 'BALANCE_VALIDATION' | 'TOKEN_AMOUNT_CALCULATION';
  payload: PriceCalculationPayload | BalanceValidationPayload | TokenAmountCalculationPayload;
}

export interface PriceCalculationPayload {
  inputAmount: string;
  price: string;
}

export interface BalanceValidationPayload {
  inputAmount: string;
  maxBalance: number;
  decimals: number;
  symbol: string;
}

export interface TokenAmountCalculationPayload {
  inputAmount: string;
  poolReserveX: number;
  poolReserveY: number;
  inputType: 'tokenX' | 'tokenY';
}

export interface CalculationResult {
  type: string;
  success: boolean;
  result?: unknown;
  error?: string;
  timestamp: number;
}

function calculateTokenAmountByPrice(inputAmount: string, price: string): string {
  try {
    if (
      parseAmountBigNumber(inputAmount).gt(0) &&
      parseAmountBigNumber(price).gt(0)
    ) {
      return parseAmountBigNumber(inputAmount)
        .multipliedBy(parseAmountBigNumber(price))
        .toString();
    }
    return "0";
  } catch (error) {
    throw new Error(`Price calculation failed: ${error}`);
  }
}

function validateBalance(
  inputAmount: string,
  maxBalance: number,
  decimals: number,
  symbol: string
): { isValid: boolean; error?: string } {
  try {
    const amount = parseAmountBigNumber(inputAmount);
    if (amount.lte(0)) {
      return { isValid: true };
    }

    const maxBalanceDecimal = parseAmountBigNumber(maxBalance.toString()).div(
      parseAmountBigNumber((10 ** decimals).toString())
    );

    if (amount.gt(maxBalanceDecimal)) {
      return {
        isValid: false,
        error: `Insufficient ${symbol} balance.`
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Balance validation failed: ${error}`
    };
  }
}

function calculateApproximateTokenAmount(
  inputAmount: string,
  poolReserveX: number,
  poolReserveY: number,
  inputType: 'tokenX' | 'tokenY'
): string {
  try {
    const amount = parseAmountBigNumber(inputAmount);
    if (amount.lte(0) || poolReserveX <= 0 || poolReserveY <= 0) {
      return "0";
    }

    const reserveX = parseAmountBigNumber(poolReserveX.toString());
    const reserveY = parseAmountBigNumber(poolReserveY.toString());

    if (inputType === 'tokenX') {
      return amount.multipliedBy(reserveY).dividedBy(reserveX).toString();
    } else {
      return amount.multipliedBy(reserveX).dividedBy(reserveY).toString();
    }
  } catch (error) {
    throw new Error(`Token amount calculation failed: ${error}`);
  }
}

self.onmessage = (event: MessageEvent<CalculationInput>) => {
  const { type, payload } = event.data;

  try {
    let result: unknown;

    switch (type) {
      case 'PRICE_CALCULATION': {
        const { inputAmount, price } = payload as PriceCalculationPayload;
        result = calculateTokenAmountByPrice(inputAmount, price);
        break;
      }

      case 'BALANCE_VALIDATION': {
        const { inputAmount, maxBalance, decimals, symbol } = payload as BalanceValidationPayload;
        result = validateBalance(inputAmount, maxBalance, decimals, symbol);
        break;
      }

      case 'TOKEN_AMOUNT_CALCULATION': {
        const { inputAmount, poolReserveX, poolReserveY, inputType } = payload as TokenAmountCalculationPayload;
        result = calculateApproximateTokenAmount(inputAmount, poolReserveX, poolReserveY, inputType);
        break;
      }

      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }

    const response: CalculationResult = {
      type,
      success: true,
      result,
      timestamp: Date.now()
    };

    self.postMessage(response);
  } catch (error) {
    const errorResponse: CalculationResult = {
      type,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    };

    self.postMessage(errorResponse);
  }
};

self.postMessage({
  type: 'WORKER_READY',
  success: true,
  timestamp: Date.now()
});