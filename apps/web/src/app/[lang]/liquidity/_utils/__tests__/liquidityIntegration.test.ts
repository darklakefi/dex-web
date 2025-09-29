import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LIQUIDITY_CONSTANTS,
  FORM_FIELD_NAMES,
} from "../../_constants/liquidityConstants";
import {
  TEST_SCENARIOS,
  expectValidTransactionPayload,
  createMockFormValues,
} from "./testUtils";
vi.mock("@dex-web/utils", () => ({
  parseAmount: vi.fn((amount: string) => Number(amount)),
  parseAmountBigNumber: vi.fn((amount: string) => ({
    gt: (value: number) => Number(amount) > value,
    multipliedBy: (multiplier: string) => ({
      toString: () => (Number(amount) * Number(multiplier)).toString(),
    }),
  })),
  sortSolanaAddresses: vi.fn((tokenA: string, tokenB: string) => ({
    tokenXAddress: tokenA,
    tokenYAddress: tokenB,
  })),
}));
import {
  createLiquidityTransactionPayload,
  calculateLiquidityAmounts,
  determineInputType,
} from "../liquidityCalculations";
import { LiquidityError, validateWalletConnection } from "../errorHandling";
import { sortSolanaAddresses } from "@dex-web/utils";
describe.skip("Liquidity Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe("Full Transaction Flow", () => {
    it("should successfully create transaction payload with valid inputs", () => {
      const scenario = TEST_SCENARIOS.VALID_TRANSACTION;
      const formValues = createMockFormValues({
        tokenAAmount: "100",
        tokenBAmount: "200",
      });
      expect(() =>
        validateWalletConnection(scenario.publicKey, scenario.walletAdapter),
      ).not.toThrow();
      const amounts = calculateLiquidityAmounts(
        scenario.poolDetails,
        {
          tokenAAmount: formValues.tokenAAmount,
          tokenBAmount: formValues.tokenBAmount,
        },
        {
          tokenAAddress: "tokenA123",
          tokenBAddress: "tokenB456",
        },
      );
      expect(amounts.maxAmountX).toBe(100);
      expect(amounts.maxAmountY).toBe(200);
      const payload = createLiquidityTransactionPayload({
        tokenAmounts: {
          tokenAAmount: formValues.tokenAAmount,
          tokenBAmount: formValues.tokenBAmount,
        },
        tokenAddresses: {
          tokenAAddress: "tokenA123",
          tokenBAddress: "tokenB456",
        },
        slippage: LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
        publicKey: scenario.publicKey,
        poolDetails: scenario.poolDetails,
      });
      expectValidTransactionPayload(payload);
      expect(payload.user).toBe(scenario.publicKey.toBase58());
      expect(payload.slippage).toBe(0.5);
    });
    it("should handle different token configurations correctly", () => {
      const testCases = [
        {
          name: "Token A is Token X",
          poolDetails: { tokenXMint: "tokenA123", tokenYMint: "tokenB456" },
          tokenAddresses: {
            tokenAAddress: "tokenA123",
            tokenBAddress: "tokenB456",
          },
          amounts: { tokenAAmount: "100", tokenBAmount: "200" },
          expectedX: 100,
          expectedY: 200,
        },
        {
          name: "Token B is Token X",
          poolDetails: { tokenXMint: "tokenB456", tokenYMint: "tokenA123" },
          tokenAddresses: {
            tokenAAddress: "tokenA123",
            tokenBAddress: "tokenB456",
          },
          amounts: { tokenAAmount: "100", tokenBAmount: "200" },
          expectedX: 200,
          expectedY: 100,
        },
      ];
      testCases.forEach((testCase) => {
        const amounts = calculateLiquidityAmounts(
          testCase.poolDetails,
          testCase.amounts,
          testCase.tokenAddresses,
        );
        expect(amounts.maxAmountX).toBe(testCase.expectedX);
        expect(amounts.maxAmountY).toBe(testCase.expectedY);
      });
    });
  });
  describe("Input Type Determination", () => {
    it("should correctly determine input types for different scenarios", () => {
      const poolDetails = {
        tokenXMint: "SOL123",
        tokenYMint: "USDC456",
      };
      const testCases = [
        {
          type: "buy" as const,
          tokenAAddress: "SOL123",
          tokenBAddress: "USDC456",
          expected: "tokenX",
        },
        {
          type: "sell" as const,
          tokenAAddress: "SOL123",
          tokenBAddress: "USDC456",
          expected: "tokenY",
        },
        {
          type: "sell" as const,
          tokenAAddress: "USDC456",
          tokenBAddress: "SOL123",
          expected: "tokenX",
        },
      ];
      testCases.forEach(({ type, tokenAAddress, tokenBAddress, expected }) => {
        const result = determineInputType(
          type,
          poolDetails,
          tokenAAddress,
          tokenBAddress,
        );
        expect(result).toBe(expected);
      });
    });
  });
  describe("Error Scenarios", () => {
    it("should handle missing wallet gracefully", () => {
      expect(() => validateWalletConnection(null, null)).toThrow(
        LiquidityError,
      );
      expect(() => validateWalletConnection(null, null)).toThrow(
        "Wallet public key is required",
      );
    });
    it("should handle invalid token addresses", () => {
      const mockSortSolanaAddresses = vi.mocked(sortSolanaAddresses);
      mockSortSolanaAddresses.mockReturnValue({
        tokenXAddress: null,
        tokenYAddress: "valid",
      });
      expect(() =>
        createLiquidityTransactionPayload({
          tokenAmounts: { tokenAAmount: "100", tokenBAmount: "200" },
          tokenAddresses: { tokenAAddress: "invalid", tokenBAddress: "valid" },
          slippage: "0.5",
          publicKey: TEST_SCENARIOS.VALID_TRANSACTION.publicKey,
          poolDetails: TEST_SCENARIOS.VALID_TRANSACTION.poolDetails,
        }),
      ).toThrow("Invalid token addresses after sorting");
    });
    it("should validate slippage bounds", () => {
      const validSlippages = ["0.1", "0.5", "1.0", "5.0"];
      const scenario = TEST_SCENARIOS.VALID_TRANSACTION;
      validSlippages.forEach((slippage) => {
        const payload = createLiquidityTransactionPayload({
          tokenAmounts: { tokenAAmount: "100", tokenBAmount: "200" },
          tokenAddresses: {
            tokenAAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            tokenBAddress: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
          },
          slippage,
          publicKey: scenario.publicKey,
          poolDetails: scenario.poolDetails,
        });
        expect(payload.slippage).toBe(Number(slippage));
        expect(payload.slippage).toBeGreaterThan(0);
        expect(payload.slippage).toBeLessThanOrEqual(5);
      });
    });
  });
  describe("Form Field Integration", () => {
    it("should use correct field names consistently", () => {
      const formValues = {
        [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: "100",
        [FORM_FIELD_NAMES.TOKEN_B_AMOUNT]: "200",
        [FORM_FIELD_NAMES.INITIAL_PRICE]: "1.5",
      };
      expect(formValues.tokenAAmount).toBe("100");
      expect(formValues.tokenBAmount).toBe("200");
      expect(formValues.initialPrice).toBe("1.5");
      const amounts = calculateLiquidityAmounts(
        TEST_SCENARIOS.VALID_TRANSACTION.poolDetails,
        {
          tokenAAmount: formValues[FORM_FIELD_NAMES.TOKEN_A_AMOUNT],
          tokenBAmount: formValues[FORM_FIELD_NAMES.TOKEN_B_AMOUNT],
        },
        {
          tokenAAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          tokenBAddress: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
        },
      );
      expect(typeof amounts.maxAmountX).toBe("number");
      expect(typeof amounts.maxAmountY).toBe("number");
    });
  });
  describe("Constants Integration", () => {
    it("should use constants consistently across functions", () => {
      const payload = createLiquidityTransactionPayload({
        tokenAmounts: {
          tokenAAmount: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
          tokenBAmount: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
        },
        tokenAddresses: {
          tokenAAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          tokenBAddress: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
        },
        slippage: LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
        publicKey: TEST_SCENARIOS.VALID_TRANSACTION.publicKey,
        poolDetails: TEST_SCENARIOS.VALID_TRANSACTION.poolDetails,
      });
      expect(payload.maxAmountX).toBe(0);
      expect(payload.maxAmountY).toBe(0);
      expect(payload.slippage).toBe(0.5);
    });
  });
});
