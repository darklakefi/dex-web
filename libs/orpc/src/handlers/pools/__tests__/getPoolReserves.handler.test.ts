import { BN } from "@coral-xyz/anchor";
import { MintLayout } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Zero PublicKey for mint authority/freeze authority when not set
const ZERO_PUBKEY = new PublicKey("11111111111111111111111111111111");

const encodeMintData = (decimals: number) => {
  const buffer = Buffer.alloc(MintLayout.span);
  MintLayout.encode(
    {
      decimals,
      freezeAuthority: ZERO_PUBKEY,
      freezeAuthorityOption: 0,
      isInitialized: true,
      mintAuthority: ZERO_PUBKEY,
      mintAuthorityOption: 0,
      supply: BigInt(0),
    },
    buffer,
  );
  return buffer;
};

const {
  mockGetPoolOnChain,
  mockGetLpTokenMint,
  mockGetMint,
  mockGetAccount,
  mockGetAccountInfo,
} = vi.hoisted(() => ({
  mockGetAccount: vi.fn(),
  mockGetAccountInfo: vi.fn(),
  mockGetLpTokenMint: vi.fn(),
  mockGetMint: vi.fn(),
  mockGetPoolOnChain: vi.fn(),
}));

vi.mock("@dex-web/core", () => ({
  getLpTokenMint: mockGetLpTokenMint,
}));

vi.mock("@solana/spl-token", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/spl-token")>();
  return {
    ...actual,
    getAccount: mockGetAccount,
    getMint: mockGetMint,
  };
});

vi.mock("../../getHelius", () => ({
  getHelius: vi.fn(() => ({
    connection: {
      getAccountInfo: mockGetAccountInfo,
    },
  })),
}));

vi.mock("../../../utils/solana", async () => {
  const actual = await vi.importActual<typeof import("../../../utils/solana")>(
    "../../../utils/solana",
  );
  return {
    ...actual,
    getPoolOnChain: mockGetPoolOnChain,
  };
});

import type { PoolAccount } from "../../../utils/solana";
import { LP_TOKEN_DECIMALS } from "../../../utils/solana";
import { getPoolReservesHandler } from "../getPoolReserves.handler";

describe("getPoolReservesHandler", () => {
  const TOKEN_PROGRAM_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );
  const TOKEN_X_MINT = "So11111111111111111111111111111111111111112";
  const TOKEN_Y_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const LP_MINT = new PublicKey("11111111111111111111111111111111");
  const RESERVE_X_PUBKEY = new PublicKey("11111111111111111111111111111112");
  const RESERVE_Y_PUBKEY = new PublicKey("11111111111111111111111111111113");

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMint.mockReset();
    mockGetAccountInfo.mockReset();
    mockGetAccount.mockReset();
  });

  describe("Pool existence", () => {
    it("should return empty result when pool does not exist", async () => {
      mockGetPoolOnChain.mockResolvedValue(null);

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result).toEqual({
        exists: false,
        lpMint: "",
        reserveX: 0,
        reserveY: 0,
        totalLpSupply: 0,
      });
    });

    it("should return pool data when pool exists", async () => {
      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN(1000000),
        protocol_fee_y: new BN(1000000),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN(100000000000),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(500000),
        user_locked_y: new BN(500000),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);

      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 })

        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });

      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(9),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt("100000000000"),
        })
        .mockResolvedValueOnce({
          amount: BigInt("10000000000"),
        });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.exists).toBe(true);
      expect(result.lpMint).toBe(LP_MINT.toBase58());
      expect(result.totalLpSupply).toBe(100);

      expect(result.reserveX).toBeCloseTo(99.9985, 4);

      expect(result.reserveY).toBeCloseTo(9998.5, 1);

      expect(result.protocolFeeX).toBeCloseTo(0.001, 6);
      expect(result.protocolFeeY).toBeCloseTo(1, 6);
      expect(result.userLockedX).toBeCloseTo(0.0005, 6);
      expect(result.userLockedY).toBeCloseTo(0.5, 6);
    });
  });

  describe("BN to Number Conversions", () => {
    it("should handle very large u64 values near max (2^64 - 1)", async () => {
      const nearMaxU64 = new BN("18446744073709551000");

      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN(0),
        protocol_fee_y: new BN(0),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: nearMaxU64,
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 })
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(9),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
      mockGetAccount
        .mockResolvedValueOnce({ amount: BigInt(1000000000) })
        .mockResolvedValueOnce({ amount: BigInt(1000000) });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.exists).toBe(true);
      expect(Number.isFinite(result.totalLpSupply)).toBe(true);
      expect(typeof result.totalLpSupplyRaw).toBe("string");
      expect(BigInt(result.totalLpSupplyRaw || "0")).toBeGreaterThan(0n);
      expect(result.totalLpSupply).toBeGreaterThan(0);
    });

    it("should handle tokens with 18 decimals (like many ERC20s)", async () => {
      const largeAmount = new BN("1000000000000000000000");

      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN(0),
        protocol_fee_y: new BN(0),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN(1000000000),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 18 })
        .mockResolvedValueOnce({ decimals: 6 })
        .mockResolvedValueOnce({ decimals: 18 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(18),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
      mockGetAccount
        .mockResolvedValueOnce({ amount: BigInt(largeAmount.toString()) })
        .mockResolvedValueOnce({ amount: BigInt(1000000) });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.exists).toBe(true);
      expect(Number.isFinite(result.reserveX)).toBe(true);
      expect(result.reserveX).toBe(1000);
    });

    it("should handle zero reserves gracefully", async () => {
      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN(0),
        protocol_fee_y: new BN(0),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN(0),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 })
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(9),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
      mockGetAccount
        .mockResolvedValueOnce({ amount: BigInt(0) })
        .mockResolvedValueOnce({ amount: BigInt(0) });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.exists).toBe(true);
      expect(result.reserveX).toBe(0);
      expect(result.reserveY).toBe(0);
      expect(result.totalLpSupply).toBe(0);
    });

    it("should handle small amounts (less than 1 token)", async () => {
      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN(100),
        protocol_fee_y: new BN(50),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN(1000000),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(50),
        user_locked_y: new BN(25),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 })
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(9),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
      mockGetAccount
        .mockResolvedValueOnce({ amount: BigInt(100) })
        .mockResolvedValueOnce({ amount: BigInt(50) });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.exists).toBe(true);
      expect(result.totalLpSupply).toBeCloseTo(0.001, 9);
      expect(result.protocolFeeX).toBeCloseTo(0.0000001, 9);
      expect(result.protocolFeeY).toBeCloseTo(0.00005, 6);
    });
  });

  describe("BN Arithmetic for Available Reserves", () => {
    it("should correctly subtract protocol fees and locked amounts", async () => {
      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN("3000000000"),
        protocol_fee_y: new BN("1000000000"),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN("10000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN("2000000000"),
        user_locked_y: new BN("500000000"),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 })
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(9),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
      mockGetAccount
        .mockResolvedValueOnce({ amount: BigInt("100000000000") })
        .mockResolvedValueOnce({ amount: BigInt("50000000000") });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.reserveX).toBe(95);

      expect(result.reserveY).toBe(48500);

      expect(result.protocolFeeX).toBe(3);
      expect(result.protocolFeeY).toBe(1000);
      expect(result.userLockedX).toBe(2);
      expect(result.userLockedY).toBe(500);
    });

    it("should handle case where fees exceed reserves (edge case)", async () => {
      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN("60000000000"),
        protocol_fee_y: new BN("30000000000"),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN("10000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN("50000000000"),
        user_locked_y: new BN("25000000000"),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 })
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(9),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
      mockGetAccount
        .mockResolvedValueOnce({ amount: BigInt("100000000000") })
        .mockResolvedValueOnce({ amount: BigInt("50000000000") });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.exists).toBe(true);
      expect(Number.isFinite(result.reserveX)).toBe(true);
      expect(Number.isFinite(result.reserveY)).toBe(true);
    });
  });

  describe("Output Schema Validation", () => {
    it("should return all values as finite numbers", async () => {
      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(1000000),
        locked_y: new BN(2000000),
        padding: [],
        protocol_fee_x: new BN(500000),
        protocol_fee_y: new BN(1000000),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN(5000000000),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(100000),
        user_locked_y: new BN(200000),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
      mockGetAccount
        .mockResolvedValueOnce({ amount: BigInt(10000000000) })
        .mockResolvedValueOnce({ amount: BigInt(5000000000) });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(Number.isFinite(result.reserveX)).toBe(true);
      expect(Number.isFinite(result.reserveY)).toBe(true);
      expect(Number.isFinite(result.totalLpSupply)).toBe(true);

      if (result.reserveXRaw !== undefined) {
        expect(typeof result.reserveXRaw).toBe("string");
        expect(() => BigInt(result.reserveXRaw || "0")).not.toThrow();
      }
      if (result.reserveYRaw !== undefined) {
        expect(typeof result.reserveYRaw).toBe("string");
        expect(() => BigInt(result.reserveYRaw || "0")).not.toThrow();
      }
      if (result.totalLpSupplyRaw !== undefined) {
        expect(typeof result.totalLpSupplyRaw).toBe("string");
        expect(() => BigInt(result.totalLpSupplyRaw || "0")).not.toThrow();
      }
      if (result.protocolFeeX !== undefined) {
        expect(Number.isFinite(result.protocolFeeX)).toBe(true);
      }
      if (result.protocolFeeY !== undefined) {
        expect(Number.isFinite(result.protocolFeeY)).toBe(true);
      }
      if (result.userLockedX !== undefined) {
        expect(Number.isFinite(result.userLockedX)).toBe(true);
      }
      if (result.userLockedY !== undefined) {
        expect(Number.isFinite(result.userLockedY)).toBe(true);
      }
    });

    it("should return non-negative values", async () => {
      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN(1000),
        protocol_fee_y: new BN(2000),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN(1000000000),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(500),
        user_locked_y: new BN(1000),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
      mockGetAccount
        .mockResolvedValueOnce({ amount: BigInt(1000000000) })
        .mockResolvedValueOnce({ amount: BigInt(1000000) });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.reserveX).toBeGreaterThanOrEqual(0);
      expect(result.reserveY).toBeGreaterThanOrEqual(0);
      expect(result.totalLpSupply).toBeGreaterThanOrEqual(0);

      if (result.protocolFeeX !== undefined) {
        expect(result.protocolFeeX).toBeGreaterThanOrEqual(0);
      }
      if (result.protocolFeeY !== undefined) {
        expect(result.protocolFeeY).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Error Handling", () => {
    it("should return empty result when reserve accounts do not exist", async () => {
      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN(0),
        protocol_fee_y: new BN(0),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN(1000000000),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });

      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(9),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValue(null);

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.exists).toBe(false);
      expect(result.lpMint).toBe(LP_MINT.toBase58());
    });

    it("should handle errors gracefully and return empty result", async () => {
      mockGetPoolOnChain.mockRejectedValue(new Error("RPC error"));

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result).toEqual({
        exists: false,
        lpMint: "",
        reserveX: 0,
        reserveY: 0,
        totalLpSupply: 0,
      });
    });

    it("should handle getAccount failures and return 0 for reserves", async () => {
      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN(0),
        protocol_fee_y: new BN(0),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN(1000000000),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 })
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(9),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });

      mockGetAccount
        .mockRejectedValueOnce(new Error("Account not found"))
        .mockRejectedValueOnce(new Error("Account not found"));

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.exists).toBe(true);
      expect(result.reserveX).toBe(0);
      expect(result.reserveY).toBe(0);
    });
  });

  describe("Different Token Decimals", () => {
    it.each([
      { decimalsX: 6, decimalsY: 6, nameX: "USDC", nameY: "USDT" },
      { decimalsX: 9, decimalsY: 6, nameX: "SOL", nameY: "USDC" },
      { decimalsX: 8, decimalsY: 9, nameX: "BTC", nameY: "SOL" },
      { decimalsX: 18, decimalsY: 6, nameX: "ETH-like", nameY: "USDC" },
    ])(
      "should correctly handle $nameX ($decimalsX decimals) and $nameY ($decimalsY decimals)",
      async ({ decimalsX, decimalsY }) => {
        const protocolFeeXStr = `1${"0".repeat(decimalsX)}`;
        const protocolFeeYStr = `1${"0".repeat(decimalsY)}`;
        const reserveXAmountStr = `100${"0".repeat(decimalsX)}`;
        const reserveYAmountStr = `200${"0".repeat(decimalsY)}`;

        const mockPoolData: PoolAccount = {
          amm_config: new PublicKey("11111111111111111111111111111111"),
          bump: 255,
          creator: new PublicKey("11111111111111111111111111111111"),
          locked_x: new BN(0),
          locked_y: new BN(0),
          padding: [],
          protocol_fee_x: new BN(protocolFeeXStr),
          protocol_fee_y: new BN(protocolFeeYStr),
          reserve_x: RESERVE_X_PUBKEY,
          reserve_y: RESERVE_Y_PUBKEY,
          token_lp_supply: new BN(1000000000),
          token_mint_x: new PublicKey(TOKEN_X_MINT),
          token_mint_y: new PublicKey(TOKEN_Y_MINT),
          user_locked_x: new BN(0),
          user_locked_y: new BN(0),
        };

        mockGetPoolOnChain.mockResolvedValue(mockPoolData);
        mockGetLpTokenMint.mockResolvedValue(LP_MINT);
        mockGetMint
          .mockResolvedValueOnce({ decimals: decimalsX })
          .mockResolvedValueOnce({ decimals: decimalsY });
        mockGetAccountInfo
          .mockResolvedValueOnce({
            data: encodeMintData(decimalsX),
            owner: TOKEN_PROGRAM_ID,
          })
          .mockResolvedValueOnce({
            data: encodeMintData(decimalsY),
            owner: TOKEN_PROGRAM_ID,
          })
          .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
          .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
          .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
          .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
        mockGetAccount
          .mockResolvedValueOnce({
            amount: BigInt(reserveXAmountStr),
          })
          .mockResolvedValueOnce({
            amount: BigInt(reserveYAmountStr),
          });

        const result = await getPoolReservesHandler({
          tokenXMint: TOKEN_X_MINT,
          tokenYMint: TOKEN_Y_MINT,
        });

        expect(result.exists).toBe(true);

        expect(result.reserveX).toBeCloseTo(99, 2);

        expect(result.reserveY).toBeCloseTo(199, 2);
        expect(result.protocolFeeX).toBeCloseTo(1, 6);
        expect(result.protocolFeeY).toBeCloseTo(1, 6);
      },
    );
  });

  describe("LP Token Decimals", () => {
    it(`should correctly handle LP tokens with ${LP_TOKEN_DECIMALS} decimals`, async () => {
      const lpSupplyRaw = new BN("1234567890000000000");

      const mockPoolData: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN(0),
        protocol_fee_y: new BN(0),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: lpSupplyRaw,
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockGetPoolOnChain.mockResolvedValue(mockPoolData);
      mockGetLpTokenMint.mockResolvedValue(LP_MINT);
      mockGetMint
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 })
        .mockResolvedValueOnce({ decimals: 9 })
        .mockResolvedValueOnce({ decimals: 6 });
      mockGetAccountInfo
        .mockResolvedValueOnce({
          data: encodeMintData(9),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          data: encodeMintData(6),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID })
        .mockResolvedValueOnce({ owner: TOKEN_PROGRAM_ID });
      mockGetAccount
        .mockResolvedValueOnce({ amount: BigInt(1000000000) })
        .mockResolvedValueOnce({ amount: BigInt(1000000) });

      const result = await getPoolReservesHandler({
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.exists).toBe(true);

      const expectedLpSupply =
        Number(lpSupplyRaw.toString()) / 10 ** LP_TOKEN_DECIMALS;
      expect(result.totalLpSupply).toBeCloseTo(expectedLpSupply, 2);
    });
  });
});
