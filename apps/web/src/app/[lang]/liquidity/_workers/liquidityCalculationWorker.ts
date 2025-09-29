import { parseAmountBigNumber } from "@dex-web/utils";

// Types for Web Worker communication
export interface CalculationInput {
  type: 'PRICE_CALCULATION' | 'BALANCE_VALIDATION' | 'TOKEN_AMOUNT_CALCULATION';
  payload: any;
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
  result?: any;
  error?: string;
  timestamp: number;
}

// Price calculation using BigNumber for precision
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

// Balance validation calculation
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
      parseAmountBigNumber(10).pow(decimals)
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

// Approximate token amount calculation for pools (for real-time feedback)
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

    // Calculate approximate ratio based on current pool reserves
    const reserveX = parseAmountBigNumber(poolReserveX.toString());
    const reserveY = parseAmountBigNumber(poolReserveY.toString());

    if (inputType === 'tokenX') {
      // Calculate corresponding tokenY amount
      return amount.multipliedBy(reserveY).dividedBy(reserveX).toString();
    } else {
      // Calculate corresponding tokenX amount
      return amount.multipliedBy(reserveX).dividedBy(reserveY).toString();
    }
  } catch (error) {
    throw new Error(`Token amount calculation failed: ${error}`);
  }
}

// Main message handler
self.onmessage = function(event: MessageEvent<CalculationInput>) {
  const { type, payload } = event.data;

  try {
    let result: any;

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

// Handle worker initialization
self.postMessage({
  type: 'WORKER_READY',
  success: true,
  timestamp: Date.now()
});