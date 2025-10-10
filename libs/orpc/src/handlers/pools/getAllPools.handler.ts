import { CACHE_CONFIG, LOGGING_CONFIG } from "../../config/constants";
import { getHelius } from "../../getHelius";
import type {
  GetAllPoolsInput,
  GetAllPoolsOutput,
} from "../../schemas/pools/getAllPools.schema";
import type { Token } from "../../schemas/tokens/token.schema";
import { CacheService } from "../../services/CacheService";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";
import {
  EXCHANGE_PROGRAM_ID,
  IDL_CODER,
  type PoolAccount,
} from "../../utils/solana";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

const cacheService = CacheService.getInstance();
const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();
export async function clearPoolsCache() {
  cacheService.invalidatePattern("^pools:");
}
export async function getAllPoolsHandler(
  input: GetAllPoolsInput,
): Promise<GetAllPoolsOutput> {
  const { limit, includeEmpty = false, search } = input;
  const cacheKey = `pools:${JSON.stringify({ includeEmpty, search })}`;
  const cached = cacheService.get<GetAllPoolsOutput>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for getAllPools", { cacheKey });
    if (limit) {
      return {
        pools: cached.pools.slice(0, limit),
        total: cached.total,
      };
    }
    return cached;
  }
  const helius = getHelius();
  const connection = helius.connection;
  const startTime = performance.now();
  try {
    // Use Anchor discriminator to filter Pool accounts
    // The discriminator is the first 8 bytes of sha256("account:Pool")
    const poolDiscriminator = Buffer.from(
      IDL_CODER.accounts.accountDiscriminator("Pool"),
    );

    const accounts = await connection.getProgramAccounts(EXCHANGE_PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: poolDiscriminator.toString("base64"),
          },
        },
      ],
    });
    const searchLower = search?.toLowerCase().trim();
    const decodedPools = accounts
      .map((account) => {
        try {
          const pool = IDL_CODER.accounts.decode<PoolAccount>(
            "Pool",
            account.account.data,
          );
          const lockedX = pool.locked_x.toString();
          const lockedY = pool.locked_y.toString();
          if (!includeEmpty && (lockedX === "0" || lockedY === "0")) {
            return null;
          }
          return {
            address: account.pubkey.toBase58(),
            lockedX,
            lockedY,
            lpTokenSupply: pool.token_lp_supply.toString(),
            protocolFeeX: pool.protocol_fee_x.toString(),
            protocolFeeY: pool.protocol_fee_y.toString(),
            tokenXMint: pool.token_mint_x.toBase58(),
            tokenYMint: pool.token_mint_y.toBase58(),
            userLockedX: pool.user_locked_x.toString(),
            userLockedY: pool.user_locked_y.toString(),
          };
        } catch (error) {
          console.error(
            "getAllPools: decode error:",
            error instanceof Error ? error.message : String(error),
          );
          return null;
        }
      })
      .filter((pool) => pool !== null);
    const uniqueTokenAddresses = Array.from(
      new Set(
        decodedPools.flatMap((pool) => [pool.tokenXMint, pool.tokenYMint]),
      ),
    );
    const tokenMetadata = await getTokenMetadataHandler({
      addresses: uniqueTokenAddresses,
      returnAsObject: true,
    });
    const tokenMap = tokenMetadata as Record<string, Token>;
    const poolsWithSymbols = decodedPools.map((pool) => ({
      ...pool,
      tokenXSymbol: tokenMap[pool.tokenXMint]?.symbol,
      tokenYSymbol: tokenMap[pool.tokenYMint]?.symbol,
    }));

    const filteredPools = searchLower
      ? poolsWithSymbols.filter((pool) => {
          const matchesSearch =
            pool.address.toLowerCase().includes(searchLower) ||
            pool.tokenXMint.toLowerCase().includes(searchLower) ||
            pool.tokenYMint.toLowerCase().includes(searchLower) ||
            (pool.tokenXSymbol?.toLowerCase() || "").includes(searchLower) ||
            (pool.tokenYSymbol?.toLowerCase() || "").includes(searchLower);
          return matchesSearch;
        })
      : poolsWithSymbols;

    const duration = performance.now() - startTime;
    if (duration > LOGGING_CONFIG.PERFORMANCE_THRESHOLD_MS) {
      logger.performance("getAllPools", duration, {
        includeEmpty,
        poolCount: filteredPools.length,
        search: search?.length || 0,
      });
    }
    monitoring.recordLatency("getAllPools", duration, {
      includeEmpty: includeEmpty.toString(),
      poolCount: filteredPools.length.toString(),
      searchLength: (search?.length || 0).toString(),
    });
    monitoring.recordSuccess("getAllPools", {
      includeEmpty: includeEmpty.toString(),
      poolCount: filteredPools.length.toString(),
    });
    const result = {
      pools: filteredPools,
      total: filteredPools.length,
    };
    cacheService.set(cacheKey, result, CACHE_CONFIG.POOLS_TTL);
    if (limit) {
      return {
        pools: filteredPools.slice(0, limit),
        total: filteredPools.length,
      };
    }
    return result;
  } catch (error) {
    logger.errorWithStack("Error fetching all pools", error as Error, {
      includeEmpty,
      search,
    });
    monitoring.recordError("getAllPools", "UNKNOWN_ERROR", {
      includeEmpty: includeEmpty.toString(),
      searchLength: (search?.length || 0).toString(),
    });
    return {
      pools: [],
      total: 0,
    };
  }
}
