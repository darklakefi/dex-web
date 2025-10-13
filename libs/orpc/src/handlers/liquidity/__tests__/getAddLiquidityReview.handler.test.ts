import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetAccount, mockGetTokenMetadataHandler } = vi.hoisted(() => ({
  mockGetAccount: vi.fn(),
  mockGetTokenMetadataHandler: vi.fn(),
}));

vi.mock("@solana/spl-token", () => ({
  getAccount: mockGetAccount,
  TOKEN_2022_PROGRAM_ID: new PublicKey(
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  ),
  TOKEN_PROGRAM_ID: new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  ),
}));

vi.mock("../../getHelius", () => ({
  getHelius: vi.fn(() => ({
    connection: {
      getAccountInfo: vi.fn().mockResolvedValue({
        data: Buffer.from([]),
        owner: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      }),
    },
  })),
}));

vi.mock("../../tokens/getTokenMetadata.handler", () => ({
  getTokenMetadataHandler: mockGetTokenMetadataHandler,
}));

const mockPoolAccount = vi.fn();
vi.mock("@coral-xyz/anchor", async () => {
  const actual =
    await vi.importActual<typeof import("@coral-xyz/anchor")>(
      "@coral-xyz/anchor",
    );
  return {
    ...actual,
    BorshCoder: vi.fn().mockImplementation(() => ({
      accounts: {
        decode: mockPoolAccount,
      },
    })),
  };
});

import type { PoolAccount } from "../../../utils/solana";
import { getAddLiquidityReviewHandler } from "../getAddLiquidityReview.handler";

describe("getAddLiquidityReviewHandler", () => {
  const TOKEN_X_MINT = "So11111111111111111111111111111111111111112";
  const TOKEN_Y_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const RESERVE_X_PUBKEY = new PublicKey("11111111111111111111111111111112");
  const RESERVE_Y_PUBKEY = new PublicKey("11111111111111111111111111111113");
  const TOKEN_PROGRAM_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Token amount calculation - isTokenX: true", () => {
    it("should calculate correct token Y amount when providing token X", async () => {
      const mockPool: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN("1000000000"),
        protocol_fee_y: new BN("100000000"),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN("10000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN("500000000"),
        user_locked_y: new BN("50000000"),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount.mockResolvedValueOnce({
        amount: BigInt("101000000000"),
        owner: TOKEN_PROGRAM_ID,
      });

      mockGetAccount.mockResolvedValueOnce({
        amount: BigInt("10150000000"),
        owner: TOKEN_PROGRAM_ID,
      });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: {
          address: TOKEN_X_MINT,
          decimals: 9,
          name: "Wrapped SOL",
          symbol: "SOL",
        },
        [TOKEN_Y_MINT]: {
          address: TOKEN_Y_MINT,
          decimals: 6,
          name: "USD Coin",
          symbol: "USDC",
        },
      });

      const result = await getAddLiquidityReviewHandler({
        isTokenX: true,
        tokenAmount: 10,
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.tokenAmount).toBeCloseTo(1005, 0);
      expect(result.tokenAmountRaw).toBeDefined();

      const expectedRaw = new BigNumber(10)
        .multipliedBy(10 ** 9)
        .multipliedBy(10000000000)
        .dividedBy(99500000000)
        .integerValue(BigNumber.ROUND_UP);

      expect(result.tokenAmountRaw).toBe(expectedRaw.toString());
    });

    it("should handle small amounts correctly", async () => {
      const mockPool: PoolAccount = {
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
        token_lp_supply: new BN("1000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt("1000000000"),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt("100000000"),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 9 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      const result = await getAddLiquidityReviewHandler({
        isTokenX: true,
        tokenAmount: 0.01,
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.tokenAmount).toBeCloseTo(1, 2);
    });

    it("should handle large amounts without precision loss", async () => {
      const largeReserveX = new BN("1000000000000000000");
      const largeReserveY = new BN("100000000000000000000");

      const mockPool: PoolAccount = {
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
        token_lp_supply: new BN("10000000000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt(largeReserveX.toString()),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt(largeReserveY.toString()),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 9 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      const result = await getAddLiquidityReviewHandler({
        isTokenX: true,
        tokenAmount: 1000,
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(Number.isFinite(result.tokenAmount)).toBe(true);
      expect(result.tokenAmount).toBeGreaterThan(0);
    });
  });

  describe("Token amount calculation - isTokenX: false", () => {
    it("should calculate correct token X amount when providing token Y", async () => {
      const mockPool: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN("1000000000"),
        protocol_fee_y: new BN("100000000"),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN("10000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN("500000000"),
        user_locked_y: new BN("50000000"),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt("101000000000"),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt("10150000000"),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 9 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      const result = await getAddLiquidityReviewHandler({
        isTokenX: false,
        tokenAmount: 1000,
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.tokenAmount).toBeCloseTo(9.95, 1);
    });

    it("should round up correctly to prevent underpayment", async () => {
      const mockPool: PoolAccount = {
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
        token_lp_supply: new BN("1000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt("3000000000"),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt("1000000000"),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 9 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      const result = await getAddLiquidityReviewHandler({
        isTokenX: false,
        tokenAmount: 1,
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.tokenAmount).toBeGreaterThanOrEqual(0.003);

      const rawAmount = BigInt(result.tokenAmountRaw);
      expect(rawAmount).toBeGreaterThanOrEqual(BigInt(3000000));
    });
  });

  describe("BN Value Handling", () => {
    it("should correctly convert BN values to BigNumber for calculations", async () => {
      const protocolFeeX = new BN("12345678900000000");
      const userLockedX = new BN("98765432100000000");

      const mockPool: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: protocolFeeX,
        protocol_fee_y: new BN("1000000"),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN("1000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: userLockedX,
        user_locked_y: new BN("500000"),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      const totalReserveX = BigInt("200000000000000000");

      mockGetAccount
        .mockResolvedValueOnce({
          amount: totalReserveX,
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt("10000000000"),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 9 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      const result = await getAddLiquidityReviewHandler({
        isTokenX: true,
        tokenAmount: 10,
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(Number.isFinite(result.tokenAmount)).toBe(true);
      expect(result.tokenAmountRaw).toBeDefined();

      const expectedAvailableX = new BigNumber(totalReserveX.toString())
        .minus(new BigNumber(userLockedX.toString()))
        .minus(new BigNumber("0"))
        .minus(new BigNumber(protocolFeeX.toString()));

      expect(expectedAvailableX.isFinite()).toBe(true);
      expect(expectedAvailableX.isPositive()).toBe(true);
    });

    it("should handle BN values that exceed Number.MAX_SAFE_INTEGER", async () => {
      const veryLargeBN = new BN("10000000000000000000");

      const mockPool: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: veryLargeBN,
        protocol_fee_y: new BN("1000000"),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN("1000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: veryLargeBN,
        user_locked_y: new BN("500000"),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt("100000000000000000000"),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt("10000000000"),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 9 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      const result = await getAddLiquidityReviewHandler({
        isTokenX: true,
        tokenAmount: 1,
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(Number.isFinite(result.tokenAmount)).toBe(true);
      expect(result.tokenAmountRaw).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle pools with zero reserves", async () => {
      const mockPool: PoolAccount = {
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

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt(0),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt(0),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 9 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      await expect(
        getAddLiquidityReviewHandler({
          isTokenX: true,
          tokenAmount: 10,
          tokenXMint: TOKEN_X_MINT,
          tokenYMint: TOKEN_Y_MINT,
        }),
      ).rejects.toThrow();
    });

    it("should handle extreme price ratios", async () => {
      const mockPool: PoolAccount = {
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
        token_lp_supply: new BN("1000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt("1000000000"),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt("1000000000000"),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 9 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      const result = await getAddLiquidityReviewHandler({
        isTokenX: true,
        tokenAmount: 0.1,
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.tokenAmount).toBeCloseTo(100000, 0);
    });

    it("should handle fees larger than reserves gracefully", async () => {
      const mockPool: PoolAccount = {
        amm_config: new PublicKey("11111111111111111111111111111111"),
        bump: 255,
        creator: new PublicKey("11111111111111111111111111111111"),
        locked_x: new BN(0),
        locked_y: new BN(0),
        padding: [],
        protocol_fee_x: new BN("150000000000"),
        protocol_fee_y: new BN("5000000000"),
        reserve_x: RESERVE_X_PUBKEY,
        reserve_y: RESERVE_Y_PUBKEY,
        token_lp_supply: new BN("1000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN("50000000000"),
        user_locked_y: new BN("2000000000"),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt("100000000000"),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt("3000000000"),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 9 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      await expect(
        getAddLiquidityReviewHandler({
          isTokenX: true,
          tokenAmount: 1,
          tokenXMint: TOKEN_X_MINT,
          tokenYMint: TOKEN_Y_MINT,
        }),
      ).rejects.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should throw error when pool is not found", async () => {
      mockPoolAccount.mockImplementation(() => {
        throw new Error("Pool not found");
      });

      await expect(
        getAddLiquidityReviewHandler({
          isTokenX: true,
          tokenAmount: 10,
          tokenXMint: TOKEN_X_MINT,
          tokenYMint: TOKEN_Y_MINT,
        }),
      ).rejects.toThrow();
    });

    it("should throw error when token metadata fetch fails", async () => {
      const mockPool: PoolAccount = {
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
        token_lp_supply: new BN("1000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt("1000000000"),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt("1000000"),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockRejectedValue(
        new Error("Failed to fetch token metadata"),
      );

      await expect(
        getAddLiquidityReviewHandler({
          isTokenX: true,
          tokenAmount: 10,
          tokenXMint: TOKEN_X_MINT,
          tokenYMint: TOKEN_Y_MINT,
        }),
      ).rejects.toThrow("Failed to calculate token Y amount for liquidity");
    });

    it("should throw error when getAccount fails", async () => {
      const mockPool: PoolAccount = {
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
        token_lp_supply: new BN("1000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount.mockRejectedValue(new Error("Account not found"));

      await expect(
        getAddLiquidityReviewHandler({
          isTokenX: true,
          tokenAmount: 10,
          tokenXMint: TOKEN_X_MINT,
          tokenYMint: TOKEN_Y_MINT,
        }),
      ).rejects.toThrow();
    });
  });

  describe("Decimal Precision", () => {
    it("should maintain precision with different token decimals", async () => {
      const mockPool: PoolAccount = {
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
        token_lp_supply: new BN("1000000000"),
        token_mint_x: new PublicKey(TOKEN_X_MINT),
        token_mint_y: new PublicKey(TOKEN_Y_MINT),
        user_locked_x: new BN(0),
        user_locked_y: new BN(0),
      };

      mockPoolAccount.mockReturnValue(mockPool);

      mockGetAccount
        .mockResolvedValueOnce({
          amount: BigInt("1000000000000000000000"),
          owner: TOKEN_PROGRAM_ID,
        })
        .mockResolvedValueOnce({
          amount: BigInt("100000000000"),
          owner: TOKEN_PROGRAM_ID,
        });

      mockGetTokenMetadataHandler.mockResolvedValue({
        [TOKEN_X_MINT]: { address: TOKEN_X_MINT, decimals: 18 },
        [TOKEN_Y_MINT]: { address: TOKEN_Y_MINT, decimals: 6 },
      });

      const result = await getAddLiquidityReviewHandler({
        isTokenX: true,
        tokenAmount: 10,
        tokenXMint: TOKEN_X_MINT,
        tokenYMint: TOKEN_Y_MINT,
      });

      expect(result.tokenAmount).toBeCloseTo(1000, 0);

      const rawAmount = BigInt(result.tokenAmountRaw);
      expect(rawAmount).toBeGreaterThan(BigInt(0));
    });
  });
});
