import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetProgramAccounts = vi.fn();
const mockGetTokenMetadataHandler = vi.fn();

// Create a stable mock connection object
const mockConnectionObject = {
  getProgramAccounts: mockGetProgramAccounts,
};

// Create a stable mock helius object
const mockHeliusObject = {
  connection: mockConnectionObject,
  endpoint: "",
};

vi.mock("../../services/CacheService", () => ({
  CacheService: {
    getInstance: () => ({
      clear: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(() => null),
      has: vi.fn(() => false),
      invalidatePattern: vi.fn(),
      set: vi.fn(),
    }),
  },
}));
vi.mock("../../services/LoggerService", () => ({
  LoggerService: {
    getInstance: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      errorWithStack: vi.fn(),
      info: vi.fn(),
      performance: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));
vi.mock("../../services/MonitoringService", () => ({
  MonitoringService: {
    getInstance: () => ({
      recordError: vi.fn(),
      recordLatency: vi.fn(),
      recordSuccess: vi.fn(),
    }),
  },
}));
vi.mock("../tokens/getTokenMetadata.handler", () => ({
  getTokenMetadataHandler: mockGetTokenMetadataHandler,
}));
vi.mock("../../getHelius", () => ({
  getHelius: () => mockHeliusObject,
}));

import type { Token } from "../../../schemas/tokens/token.schema";
import { EXCHANGE_PROGRAM_ID, IDL_CODER } from "../../../utils/solana";
import { getAllPoolsHandler } from "../getAllPools.handler";

const mockPoolAccount1 = {
  authority: new PublicKey("11111111111111111111111111111111"),
  bump: new BN(0),
  locked_x: new BN(1000000000),
  locked_y: new BN(2000000000),
  protocol_fee_x: new BN(10000),
  protocol_fee_y: new BN(20000),
  reserve_x: new PublicKey("So11111111111111111111111111111111111111112"),
  reserve_y: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  token_lp_supply: new BN(1414213562),
  user_locked_x: new BN(500000),
  user_locked_y: new BN(1000000),
};
const mockPoolAccount2 = {
  authority: new PublicKey("11111111111111111111111111111111"),
  bump: new BN(0),
  locked_x: new BN(5000000000),
  locked_y: new BN(10000000000),
  protocol_fee_x: new BN(5000),
  protocol_fee_y: new BN(10000),
  reserve_x: new PublicKey("9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump"),
  reserve_y: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  token_lp_supply: new BN(7071067811),
  user_locked_x: new BN(250000),
  user_locked_y: new BN(500000),
};
const mockEmptyPoolAccount = {
  authority: new PublicKey("11111111111111111111111111111111"),
  bump: new BN(0),
  locked_x: new BN(0),
  locked_y: new BN(0),
  protocol_fee_x: new BN(0),
  protocol_fee_y: new BN(0),
  reserve_x: new PublicKey("DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX"),
  reserve_y: new PublicKey("HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY"),
  token_lp_supply: new BN(0),
  user_locked_x: new BN(0),
  user_locked_y: new BN(0),
};
describe("getAllPoolsHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnection?.mockClear();
    mockGetTokenMetadataHandler.mockClear();
    mockGetTokenMetadataHandler.mockResolvedValue({});
  });
  describe("Basic functionality", () => {
    it("should list pools with expected fields", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount2),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("So11111111111111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.address).toBe("11111111111111111111111111111111");
      expect(result.pools[0]!.tokenXMint).toBe(
        "So11111111111111111111111111111111111111112",
      );
      expect(result.pools[0]!.tokenYMint).toBe(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      );
      expect(result.pools[0]!.lockedX).toBe("1000000000");
      expect(result.pools[0]!.lockedY).toBe("2000000000");
    });
    it("should call getProgramAccounts with correct filters", async () => {
      mockConnection.mockResolvedValue([]);
      await getAllPoolsHandler({ includeEmpty: false, search: undefined });
      expect(mockConnection).toHaveBeenCalledWith(EXCHANGE_PROGRAM_ID, {
        filters: [
          {
            dataSize: 232,
          },
        ],
      });
    });
    it("should return empty array when no pools exist", async () => {
      mockConnection.mockResolvedValue([]);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
  describe("Limit parameter", () => {
    it("should respect limit parameter", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount2),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("So11111111111111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        limit: 1,
        search: undefined,
      });
      expect(result.pools).toHaveLength(1);
      expect(result.total).toBe(2);
    });
    it("should cap results when limit exceeds total", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        limit: 100,
        search: undefined,
      });
      expect(result.pools).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
  describe("includeEmpty parameter", () => {
    it("should exclude empty pools by default", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockEmptyPoolAccount),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("So11111111111111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.address).toBe("11111111111111111111111111111112");
    });
    it("should include empty pools when includeEmpty is true", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockEmptyPoolAccount),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("So11111111111111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: true,
        search: undefined,
      });
      expect(result.pools).toHaveLength(2);
      expect(result.total).toBe(2);
    });
    it("should exclude pools with only lockedX as zero", async () => {
      const mockPartiallyEmptyPool = {
        ...mockPoolAccount1,
        locked_x: new BN(0),
        locked_y: new BN(1000000),
      };
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPartiallyEmptyPool),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });
    it("should exclude pools with only lockedY as zero", async () => {
      const mockPartiallyEmptyPool = {
        ...mockPoolAccount1,
        locked_x: new BN(1000000),
        locked_y: new BN(0),
      };
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPartiallyEmptyPool),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
  describe("Data transformation", () => {
    it("should correctly transform pool data to output format", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]).toEqual({
        address: "11111111111111111111111111111111",
        lockedX: "1000000000",
        lockedY: "2000000000",
        lpTokenSupply: "1414213562",
        protocolFeeX: "10000",
        protocolFeeY: "20000",
        tokenXMint: "So11111111111111111111111111111111111111112",
        tokenYMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        userLockedX: "500000",
        userLockedY: "1000000",
      });
    });
    it("should handle large number values correctly", async () => {
      const mockLargePoolAccount = {
        ...mockPoolAccount1,
        locked_x: new BN(999999999999),
        locked_y: new BN(888888888888),
        token_lp_supply: new BN(777777777777),
      };
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockLargePoolAccount),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.lockedX).toBe("999999999999");
      expect(result.pools[0]!.lockedY).toBe("888888888888");
      expect(result.pools[0]!.lpTokenSupply).toBe("777777777777");
    });
  });
  describe("Error handling", () => {
    it("should return empty result when getProgramAccounts fails", async () => {
      mockConnection.mockRejectedValue(new Error("RPC connection failed"));
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });
    it("should skip pools that fail to decode", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
        {
          account: {
            data: Buffer.from("invalid data"),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111113"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.address).toBe("11111111111111111111111111111111");
    });
    it("should handle network errors gracefully", async () => {
      mockConnection.mockRejectedValue(new Error("Network timeout"));
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
  describe("Combined parameters", () => {
    it("should apply both limit and includeEmpty correctly", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockEmptyPoolAccount),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111113"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount2),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111114"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      const result = await getAllPoolsHandler({
        includeEmpty: true,
        limit: 2,
        search: undefined,
      });
      expect(result.pools).toHaveLength(2);
      expect(result.total).toBe(3);
    });
  });
  describe("Search functionality", () => {
    const mockTokenMetadata: Record<string, Token> = {
      "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump": {
        address: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
        decimals: 6,
        name: "Fartcoin",
        symbol: "FARTCOIN",
      },
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        decimals: 6,
        name: "USD Coin",
        symbol: "USDC",
      },
      So11111111111111111111111111111111111111112: {
        address: "So11111111111111111111111111111111111111112",
        decimals: 9,
        name: "Solana",
        symbol: "SOL",
      },
    };
    it("should search by token symbol", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111111"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount2),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("So11111111111111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue(mockTokenMetadata);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: "SOL",
      });
      expect(result.pools).toHaveLength(1);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.tokenXSymbol).toBe("SOL");
      expect(result.pools[0]!.tokenYSymbol).toBe("USDC");
    });
    it("should search by token symbol case insensitive", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111112"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount2),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111113"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue(mockTokenMetadata);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: "usdc",
      });
      expect(result.pools).toHaveLength(2);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.tokenYSymbol).toBe("USDC");
      expect(result.pools[1]).toBeDefined();
      expect(result.pools[1]!.tokenYSymbol).toBe("USDC");
    });
    it("should search by partial token symbol", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount2),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue(mockTokenMetadata);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: "FART",
      });
      expect(result.pools).toHaveLength(1);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.tokenXSymbol).toBe("FARTCOIN");
    });
    it("should search by token mint address", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111112"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount2),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111113"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue(mockTokenMetadata);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: "So111111111111111111111111111111",
      });
      expect(result.pools).toHaveLength(1);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.tokenXMint).toContain("So11111111");
    });
    it("should search by pool address", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111112"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount2),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111113"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue(mockTokenMetadata);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: "11111111111111111111111111111111",
      });
      expect(result.pools).toHaveLength(1);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.address).toBe("11111111111111111111111111111111");
    });
    it("should return empty array when search matches nothing", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue(mockTokenMetadata);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: "NONEXISTENT",
      });
      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });
    it("should include token symbols in response", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue(mockTokenMetadata);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.tokenXSymbol).toBe("SOL");
      expect(result.pools[0]!.tokenYSymbol).toBe("USDC");
    });
    it("should handle missing token metadata gracefully", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue({});
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: undefined,
      });
      expect(result.pools).toHaveLength(1);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.tokenXSymbol).toBeUndefined();
      expect(result.pools[0]!.tokenYSymbol).toBeUndefined();
    });
    it("should combine search with limit parameter", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111112"),
        },
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount2),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111113"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue(mockTokenMetadata);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        limit: 1,
        search: "USDC",
      });
      expect(result.pools).toHaveLength(1);
      expect(result.total).toBe(2);
    });
    it("should trim whitespace from search query", async () => {
      const mockAccounts = [
        {
          account: {
            data: IDL_CODER.accounts.encode("Pool", mockPoolAccount1),
            executable: false,
            lamports: 1000000,
            owner: EXCHANGE_PROGRAM_ID,
            rentEpoch: 0,
          },
          pubkey: new PublicKey("11111111111111111111111111111112"),
        },
      ];
      mockConnection.mockResolvedValue(mockAccounts);
      mockGetTokenMetadataHandler.mockResolvedValue(mockTokenMetadata);
      const result = await getAllPoolsHandler({
        includeEmpty: false,
        search: "SOL",
      });
      expect(result.pools).toHaveLength(1);
      expect(result.pools[0]).toBeDefined();
      expect(result.pools[0]!.tokenXSymbol).toBe("SOL");
    });
  });
});
