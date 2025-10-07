import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_CONFIG } from "../../../config/constants";
import type { HeliusClientWithConnection } from "../../../getHelius";
import { CacheService } from "../../../services/CacheService";
import { LoggerService } from "../../../services/LoggerService";
import { MonitoringService } from "../../../services/MonitoringService";
import { IDL_CODER } from "../../../utils/solana";
import { getTokenMetadataHandler } from "../../tokens/getTokenMetadata.handler";
import { clearPoolsCache, getAllPoolsHandler } from "../getAllPools.handler";

vi.mock("../../getHelius", () => ({
  getHelius: vi.fn(() => ({
    connection: {
      getProgramAccounts: vi.fn(),
    },
  })),
}));

vi.mock("../../tokens/getTokenMetadata.handler", () => ({
  getTokenMetadataHandler: vi.fn(),
}));

vi.mock("../../../utils/solana", async () => {
  const actual = await vi.importActual("../../../utils/solana");
  return {
    ...actual,
    IDL_CODER: {
      accounts: {
        decode: vi.fn(),
      },
    },
  };
});

describe("getAllPoolsHandler", () => {
  let cacheService: CacheService;
  let loggerService: LoggerService;
  let monitoringService: MonitoringService;
  let mockConnection: {
    getProgramAccounts: ReturnType<typeof vi.fn>;
  };

  const mockPoolAccount1 = {
    authority: new PublicKey("11111111111111111111111111111112"),
    bump: new BN(1),
    locked_x: new BN(1000000),
    locked_y: new BN(2000000),
    protocol_fee_x: new BN(500),
    protocol_fee_y: new BN(1000),
    reserve_x: new PublicKey("111111111111111111111111111111125"),
    reserve_y: new PublicKey("111111111111111111111111111111126"),
    token_lp_supply: new BN(5000000),
    user_locked_x: new BN(100000),
    user_locked_y: new BN(200000),
  };

  const mockPoolAccount2 = {
    authority: new PublicKey("11111111111111111111111111111113"),
    bump: new BN(1),
    locked_x: new BN(3000000),
    locked_y: new BN(4000000),
    protocol_fee_x: new BN(600),
    protocol_fee_y: new BN(1200),
    reserve_x: new PublicKey("111111111111111111111111111111127"),
    reserve_y: new PublicKey("111111111111111111111111111111128"),
    token_lp_supply: new BN(7000000),
    user_locked_x: new BN(150000),
    user_locked_y: new BN(250000),
  };

  const mockPoolAccountEmpty = {
    authority: new PublicKey("11111111111111111111111111111114"),
    bump: new BN(1),
    locked_x: new BN(0),
    locked_y: new BN(0),
    protocol_fee_x: new BN(0),
    protocol_fee_y: new BN(0),
    reserve_x: new PublicKey("111111111111111111111111111111129"),
    reserve_y: new PublicKey("111111111111111111111111111111131"),
    token_lp_supply: new BN(0),
    user_locked_x: new BN(0),
    user_locked_y: new BN(0),
  };

  const mockTokenMetadata = {
    "111111111111111111111111111111125": {
      address: "111111111111111111111111111111125",
      decimals: 6,
      symbol: "SOL",
    },
    "111111111111111111111111111111126": {
      address: "111111111111111111111111111111126",
      decimals: 6,
      symbol: "USDC",
    },
    "111111111111111111111111111111127": {
      address: "111111111111111111111111111111127",
      decimals: 9,
      symbol: "BONK",
    },
    "111111111111111111111111111111128": {
      address: "111111111111111111111111111111128",
      decimals: 6,
      symbol: "USDT",
    },
    "111111111111111111111111111111129": {
      address: "111111111111111111111111111111129",
      decimals: 6,
      symbol: "EMPTY1",
    },
    "111111111111111111111111111111131": {
      address: "111111111111111111111111111111131",
      decimals: 6,
      symbol: "EMPTY2",
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    cacheService = CacheService.getInstance();
    cacheService.clear();

    loggerService = LoggerService.getInstance();
    monitoringService = MonitoringService.getInstance();

    const { getHelius } = vi.mocked(await import("../../getHelius"));
    mockConnection = {
      getProgramAccounts: vi.fn(),
    };
    getHelius.mockReturnValue({
      connection: mockConnection,
    } as HeliusClientWithConnection);

    vi.mocked(getTokenMetadataHandler).mockResolvedValue(mockTokenMetadata);
  });

  describe("Basic functionality", () => {
    it("should fetch and return all pools with token metadata", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111122"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);

      vi.mocked(IDL_CODER.accounts.decode)
        .mockReturnValueOnce(mockPoolAccount1)
        .mockReturnValueOnce(mockPoolAccount2);

      const result = await getAllPoolsHandler({});

      expect(result.pools).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pools[0]).toMatchObject({
        address: "111111111111111111111111111111121",
        lockedX: "1000000",
        lockedY: "2000000",
        tokenXMint: "111111111111111111111111111111125",
        tokenXSymbol: "SOL",
        tokenYMint: "111111111111111111111111111111126",
        tokenYSymbol: "USDC",
      });
      expect(result.pools[1]).toMatchObject({
        address: "111111111111111111111111111111122",
        lockedX: "3000000",
        lockedY: "4000000",
        tokenXMint: "111111111111111111111111111111127",
        tokenXSymbol: "BONK",
        tokenYMint: "111111111111111111111111111111128",
        tokenYSymbol: "USDT",
      });
    });

    it("should filter out empty pools by default", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111122"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111123"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);

      vi.mocked(IDL_CODER.accounts.decode)
        .mockReturnValueOnce(mockPoolAccount1)
        .mockReturnValueOnce(mockPoolAccountEmpty)
        .mockReturnValueOnce(mockPoolAccount2);

      const result = await getAllPoolsHandler({ includeEmpty: false });

      expect(result.pools).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(
        result.pools.every((p) => p.lockedX !== "0" && p.lockedY !== "0"),
      ).toBe(true);
    });

    it("should include empty pools when includeEmpty is true", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111122"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);

      vi.mocked(IDL_CODER.accounts.decode)
        .mockReturnValueOnce(mockPoolAccount1)
        .mockReturnValueOnce(mockPoolAccountEmpty);

      const result = await getAllPoolsHandler({ includeEmpty: true });

      expect(result.pools).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(
        result.pools.some((p) => p.lockedX === "0" || p.lockedY === "0"),
      ).toBe(true);
    });

    it("should return empty array when no pools exist", async () => {
      mockConnection.getProgramAccounts.mockResolvedValue([]);

      const result = await getAllPoolsHandler({});

      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("Limit functionality", () => {
    it("should respect limit parameter", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111122"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111123"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);

      vi.mocked(IDL_CODER.accounts.decode)
        .mockReturnValueOnce(mockPoolAccount1)
        .mockReturnValueOnce(mockPoolAccount2)
        .mockReturnValueOnce(mockPoolAccount1);

      const result = await getAllPoolsHandler({ limit: 2 });

      expect(result.pools).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    it("should return all pools when limit exceeds total", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);

      vi.mocked(IDL_CODER.accounts.decode).mockReturnValueOnce(
        mockPoolAccount1,
      );

      const result = await getAllPoolsHandler({ limit: 100 });

      expect(result.pools).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("Search functionality", () => {
    beforeEach(() => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111122"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);

      vi.mocked(IDL_CODER.accounts.decode)
        .mockReturnValue(mockPoolAccount1)
        .mockReturnValueOnce(mockPoolAccount1)
        .mockReturnValueOnce(mockPoolAccount2);
    });

    it("should filter pools by token symbol", async () => {
      const result = await getAllPoolsHandler({ search: "SOL" });

      expect(result.pools).toHaveLength(1);
      expect(result.pools[0].tokenXSymbol).toBe("SOL");
    });

    it("should filter pools by pool address", async () => {
      const result = await getAllPoolsHandler({
        search: "111111111111111111111111111111121",
      });

      expect(result.pools).toHaveLength(1);
      expect(result.pools[0].address).toContain(
        "111111111111111111111111111111121",
      );
    });

    it("should filter pools by token mint address", async () => {
      const result = await getAllPoolsHandler({
        search: "111111111111111111111111111111125",
      });

      expect(result.pools).toHaveLength(1);
      expect(result.pools[0].tokenXMint).toBe(
        "111111111111111111111111111111125",
      );
    });

    it("should be case insensitive", async () => {
      const result = await getAllPoolsHandler({ search: "sol" });

      expect(result.pools).toHaveLength(1);
      expect(result.pools[0].tokenXSymbol).toBe("SOL");
    });

    it("should trim search query", async () => {
      const result = await getAllPoolsHandler({ search: "  SOL  " });

      expect(result.pools).toHaveLength(1);
      expect(result.pools[0].tokenXSymbol).toBe("SOL");
    });

    it("should return empty array when no matches found", async () => {
      const result = await getAllPoolsHandler({ search: "NONEXISTENT" });

      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("Caching", () => {
    beforeEach(() => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode).mockReturnValue(mockPoolAccount1);
    });

    it("should cache results", async () => {
      await getAllPoolsHandler({});

      expect(mockConnection.getProgramAccounts).toHaveBeenCalledTimes(1);

      await getAllPoolsHandler({});

      expect(mockConnection.getProgramAccounts).toHaveBeenCalledTimes(1);
    });

    it("should use different cache keys for different parameters", async () => {
      await getAllPoolsHandler({ includeEmpty: false });
      await getAllPoolsHandler({ includeEmpty: true });

      expect(mockConnection.getProgramAccounts).toHaveBeenCalledTimes(2);
    });

    it("should cache with correct TTL", async () => {
      const spy = vi.spyOn(cacheService, "set");

      await getAllPoolsHandler({});

      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        CACHE_CONFIG.POOLS_TTL,
      );
    });

    it("should apply limit to cached results", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111122"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111123"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode).mockReturnValue(mockPoolAccount1);

      await getAllPoolsHandler({});

      const result = await getAllPoolsHandler({ limit: 2 });

      expect(result.pools).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(mockConnection.getProgramAccounts).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("should handle connection errors gracefully", async () => {
      mockConnection.getProgramAccounts.mockRejectedValue(
        new Error("Connection failed"),
      );

      const result = await getAllPoolsHandler({});

      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should handle decode errors gracefully", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111122"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);

      vi.mocked(IDL_CODER.accounts.decode)
        .mockImplementationOnce(() => {
          throw new Error("Decode error");
        })
        .mockReturnValueOnce(mockPoolAccount1);

      const result = await getAllPoolsHandler({});

      expect(result.pools).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should handle token metadata fetch errors", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode).mockReturnValue(mockPoolAccount1);
      vi.mocked(getTokenMetadataHandler).mockRejectedValue(
        new Error("Token metadata fetch failed"),
      );

      const result = await getAllPoolsHandler({});

      expect(result.pools).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("Monitoring and logging", () => {
    beforeEach(() => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode).mockReturnValue(mockPoolAccount1);
    });

    it("should record success metrics", async () => {
      const spy = vi.spyOn(monitoringService, "recordSuccess");

      await getAllPoolsHandler({});

      expect(spy).toHaveBeenCalledWith("getAllPools", expect.any(Object));
    });

    it("should record latency metrics", async () => {
      const spy = vi.spyOn(monitoringService, "recordLatency");

      await getAllPoolsHandler({});

      expect(spy).toHaveBeenCalledWith(
        "getAllPools",
        expect.any(Number),
        expect.any(Object),
      );
    });

    it("should record error metrics on failure", async () => {
      const spy = vi.spyOn(monitoringService, "recordError");
      mockConnection.getProgramAccounts.mockRejectedValue(
        new Error("Test error"),
      );

      await getAllPoolsHandler({});

      expect(spy).toHaveBeenCalledWith(
        "getAllPools",
        "UNKNOWN_ERROR",
        expect.any(Object),
      );
    });

    it("should log performance when threshold exceeded", async () => {
      const spy = vi.spyOn(loggerService, "performance");

      const originalPerformance = global.performance.now;
      let callCount = 0;
      global.performance.now = vi.fn(() => {
        callCount++;
        return callCount === 1 ? 0 : 2000;
      });

      await getAllPoolsHandler({});

      expect(spy).toHaveBeenCalled();

      global.performance.now = originalPerformance;
    });

    it("should log errors with stack trace", async () => {
      const spy = vi.spyOn(loggerService, "errorWithStack");
      mockConnection.getProgramAccounts.mockRejectedValue(
        new Error("Test error"),
      );

      await getAllPoolsHandler({});

      expect(spy).toHaveBeenCalledWith(
        "Error fetching all pools",
        expect.any(Error),
        expect.any(Object),
      );
    });
  });

  describe("clearPoolsCache", () => {
    it("should clear cache with pattern", async () => {
      const spy = vi.spyOn(cacheService, "invalidatePattern");

      await clearPoolsCache();

      expect(spy).toHaveBeenCalledWith("^pools:");
    });

    it("should clear all pools cache entries", async () => {
      cacheService.set("pools:test1", { pools: [], total: 0 });
      cacheService.set("pools:test2", { pools: [], total: 0 });
      cacheService.set("other:test", { data: "test" });

      await clearPoolsCache();

      expect(cacheService.get("pools:test1")).toBeNull();
      expect(cacheService.get("pools:test2")).toBeNull();
      expect(cacheService.get("other:test")).not.toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle pools with very large numbers", async () => {
      const largePoolAccount = {
        ...mockPoolAccount1,
        locked_x: new BN("999999999999999999"),
        locked_y: new BN("999999999999999999"),
        token_lp_supply: new BN("999999999999999999"),
      };

      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode).mockReturnValue(largePoolAccount);

      const result = await getAllPoolsHandler({});

      expect(result.pools).toHaveLength(1);
      expect(result.pools[0].lockedX).toBe("999999999999999999");
      expect(result.pools[0].lockedY).toBe("999999999999999999");
    });

    it("should handle pools with missing token symbols", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode).mockReturnValue(mockPoolAccount1);
      vi.mocked(getTokenMetadataHandler).mockResolvedValue({});

      const result = await getAllPoolsHandler({});

      expect(result.pools).toHaveLength(1);
      expect(result.pools[0].tokenXSymbol).toBeUndefined();
      expect(result.pools[0].tokenYSymbol).toBeUndefined();
    });

    it("should handle empty search string", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode).mockReturnValue(mockPoolAccount1);

      const result = await getAllPoolsHandler({ search: "" });

      expect(result.pools).toHaveLength(1);
    });

    it("should handle search with only whitespace", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode).mockReturnValue(mockPoolAccount1);

      const result = await getAllPoolsHandler({ search: "   " });

      expect(result.pools).toHaveLength(1);
    });

    it("should handle pools with one locked value as zero", async () => {
      const partiallyEmptyPool = {
        ...mockPoolAccount1,
        locked_x: new BN(1000000),
        locked_y: new BN(0),
      };

      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode).mockReturnValue(partiallyEmptyPool);

      const result = await getAllPoolsHandler({ includeEmpty: false });

      expect(result.pools).toHaveLength(0);
    });

    it("should handle duplicate token addresses", async () => {
      const mockAccounts = [
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111121"),
        },
        {
          account: { data: Buffer.from([]) },
          pubkey: new PublicKey("111111111111111111111111111111122"),
        },
      ];

      mockConnection.getProgramAccounts.mockResolvedValue(mockAccounts);
      vi.mocked(IDL_CODER.accounts.decode)
        .mockReturnValueOnce(mockPoolAccount1)
        .mockReturnValueOnce(mockPoolAccount1);

      const getTokenMetadataSpy = vi.mocked(getTokenMetadataHandler);

      await getAllPoolsHandler({});

      expect(getTokenMetadataSpy).toHaveBeenCalledWith({
        addresses: expect.arrayContaining([
          "111111111111111111111111111111125",
          "111111111111111111111111111111126",
        ]),
        returnAsObject: true,
      });
    });
  });
});
