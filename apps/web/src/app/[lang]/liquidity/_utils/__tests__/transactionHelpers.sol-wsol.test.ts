/**
 * SOL/WSOL specific tests for liquidity transaction helpers
 * Tests the acceptance criteria for gateway address handling in liquidity operations
 */

import type { TokenOrderContext } from "@dex-web/utils";
import { PublicKey } from "@solana/web3.js";
import type {
  LiquidityFormValues,
  PoolDetails,
} from "../../../_types/liquidity";
import { buildRequestPayload } from "../transactionHelpers";

const SOL_ADDRESS = "So11111111111111111111111111111111111111111";
const WSOL_ADDRESS = "So11111111111111111111111111111111111111112";
const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MOCK_PUBLIC_KEY = new PublicKey("11111111111111111111111111111112");

const mockPoolData: PoolDetails = {
  address: "mock-pool-address",
  lockedX: "1000000000",
  lockedY: "1000000000",
  lpTokenSupply: "1000000000",
  protocolFeeX: "0",
  protocolFeeY: "0",
  tokenXMint: SOL_ADDRESS,
  tokenXReserveRaw: "1000000000",
  tokenYMint: USDC_ADDRESS,
  tokenYReserveRaw: "1000000000",
  totalSupplyRaw: "1000000000",
  userLockedX: "0",
  userLockedY: "0",
};

const mockFormValues: LiquidityFormValues = {
  tokenAAmount: "1",
  tokenBAmount: "100",
};

const mockTokenMeta = {
  decimals: 9,
};

describe("transactionHelpers SOL/WSOL Gateway Address Tests", () => {
  describe("buildRequestPayload - Gateway Address Handling", () => {
    it("should send SOL address to gateway when SOL is selected", () => {
      const orderContext: TokenOrderContext = {
        mapping: {
          tokenAIsX: true,
        },
        protocol: {
          tokenX: SOL_ADDRESS,
          tokenY: USDC_ADDRESS,
        },
        ui: {
          tokenA: SOL_ADDRESS,
          tokenB: USDC_ADDRESS,
        },
      };

      const result = buildRequestPayload({
        currentPoolData: mockPoolData,
        effectivePublicKey: MOCK_PUBLIC_KEY,
        orderContext,
        refCode: "",
        tokenAMeta: mockTokenMeta,
        tokenBMeta: { decimals: 6 },
        trimmedTokenAAddress: SOL_ADDRESS,
        trimmedTokenBAddress: USDC_ADDRESS,
        values: mockFormValues,
      });

      expect(result.tokenMintX).toBe(SOL_ADDRESS);
      expect(result.tokenMintY).toBe(USDC_ADDRESS);
    });

    it("should send WSOL address to gateway when WSOL is selected", () => {
      const orderContext: TokenOrderContext = {
        mapping: {
          tokenAIsX: true,
        },
        protocol: {
          tokenX: WSOL_ADDRESS,
          tokenY: USDC_ADDRESS,
        },
        ui: {
          tokenA: WSOL_ADDRESS,
          tokenB: USDC_ADDRESS,
        },
      };

      const poolDataWithWSOL = {
        ...mockPoolData,
        tokenXMint: WSOL_ADDRESS,
      };

      const result = buildRequestPayload({
        currentPoolData: poolDataWithWSOL,
        effectivePublicKey: MOCK_PUBLIC_KEY,
        orderContext,
        refCode: "",
        tokenAMeta: mockTokenMeta,
        tokenBMeta: { decimals: 6 },
        trimmedTokenAAddress: WSOL_ADDRESS,
        trimmedTokenBAddress: USDC_ADDRESS,
        values: mockFormValues,
      });

      expect(result.tokenMintX).toBe(WSOL_ADDRESS);
      expect(result.tokenMintY).toBe(USDC_ADDRESS);
    });

    it("should handle SOL to WSOL liquidity correctly", () => {
      const orderContext: TokenOrderContext = {
        mapping: {
          tokenAIsX: true,
        },
        protocol: {
          tokenX: SOL_ADDRESS,
          tokenY: WSOL_ADDRESS,
        },
        ui: {
          tokenA: SOL_ADDRESS,
          tokenB: WSOL_ADDRESS,
        },
      };

      const poolDataSolWsol = {
        ...mockPoolData,
        tokenXMint: SOL_ADDRESS,
        tokenYMint: WSOL_ADDRESS,
      };

      const result = buildRequestPayload({
        currentPoolData: poolDataSolWsol,
        effectivePublicKey: MOCK_PUBLIC_KEY,
        orderContext,
        refCode: "",
        tokenAMeta: mockTokenMeta,
        tokenBMeta: mockTokenMeta,
        trimmedTokenAAddress: SOL_ADDRESS,
        trimmedTokenBAddress: WSOL_ADDRESS,
        values: mockFormValues,
      });

      expect(result.tokenMintX).toBe(SOL_ADDRESS);
      expect(result.tokenMintY).toBe(WSOL_ADDRESS);
    });

    it("should handle reversed token order correctly", () => {
      const orderContext: TokenOrderContext = {
        mapping: {
          tokenAIsX: false,
        },
        protocol: {
          tokenX: SOL_ADDRESS,
          tokenY: USDC_ADDRESS,
        },
        ui: {
          tokenA: USDC_ADDRESS,
          tokenB: SOL_ADDRESS,
        },
      };

      const result = buildRequestPayload({
        currentPoolData: mockPoolData,
        effectivePublicKey: MOCK_PUBLIC_KEY,
        orderContext,
        refCode: "",
        tokenAMeta: { decimals: 6 },
        tokenBMeta: mockTokenMeta,
        trimmedTokenAAddress: USDC_ADDRESS,
        trimmedTokenBAddress: SOL_ADDRESS,
        values: mockFormValues,
      });

      expect(result.tokenMintX).toBe(SOL_ADDRESS);
      expect(result.tokenMintY).toBe(USDC_ADDRESS);
    });
  });

  describe("Request Payload Structure", () => {
    it("should include all required fields for gateway call", () => {
      const orderContext: TokenOrderContext = {
        mapping: {
          tokenAIsX: true,
        },
        protocol: {
          tokenX: SOL_ADDRESS,
          tokenY: USDC_ADDRESS,
        },
        ui: {
          tokenA: SOL_ADDRESS,
          tokenB: USDC_ADDRESS,
        },
      };

      const result = buildRequestPayload({
        currentPoolData: mockPoolData,
        effectivePublicKey: MOCK_PUBLIC_KEY,
        orderContext,
        refCode: "test-ref",
        tokenAMeta: mockTokenMeta,
        tokenBMeta: { decimals: 6 },
        trimmedTokenAAddress: SOL_ADDRESS,
        trimmedTokenBAddress: USDC_ADDRESS,
        values: mockFormValues,
      });

      expect(result).toEqual({
        amountLp: expect.any(BigInt),
        label: "",
        maxAmountX: expect.any(BigInt),
        maxAmountY: expect.any(BigInt),
        refCode: "test-ref",
        tokenMintX: SOL_ADDRESS,
        tokenMintY: USDC_ADDRESS,
        userAddress: MOCK_PUBLIC_KEY.toBase58(),
      });
    });

    it("should calculate correct amounts based on token decimals", () => {
      const orderContext: TokenOrderContext = {
        mapping: {
          tokenAIsX: true,
        },
        protocol: {
          tokenX: SOL_ADDRESS,
          tokenY: USDC_ADDRESS,
        },
        ui: {
          tokenA: SOL_ADDRESS,
          tokenB: USDC_ADDRESS,
        },
      };

      const result = buildRequestPayload({
        currentPoolData: mockPoolData,
        effectivePublicKey: MOCK_PUBLIC_KEY,
        orderContext,
        refCode: "",
        tokenAMeta: { decimals: 9 },
        tokenBMeta: { decimals: 6 },
        trimmedTokenAAddress: SOL_ADDRESS,
        trimmedTokenBAddress: USDC_ADDRESS,
        values: {
          tokenAAmount: "1",
          tokenBAmount: "100",
        },
      });

      expect(result.maxAmountX).toBe(BigInt("1000000000"));

      expect(result.maxAmountY).toBe(BigInt("100000000"));
    });
  });
});
