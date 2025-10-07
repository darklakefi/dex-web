import type { Token } from "../schemas/tokens/token.schema";
import { CircuitBreakerService } from "./CircuitBreakerService";
import { LoggerService } from "./LoggerService";
import { MetricsService } from "./MetricsService";

export interface TokenSearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
  onlyWithPools?: boolean;
}

export interface TokenSearchResult {
  tokens: Token[];
  total: number;
  hasMore: boolean;
  poolTokenAddresses: string[];
}

export class TokenSearchService {
  private static instance: TokenSearchService;
  private poolTokenAddresses: Set<string> = new Set();
  private lastPoolUpdate: number = 0;
  private readonly POOL_CACHE_TTL = 30000;
  private circuitBreaker = CircuitBreakerService.getInstance();
  private logger = LoggerService.getInstance();
  private metrics = MetricsService.getInstance();

  static getInstance(): TokenSearchService {
    if (!TokenSearchService.instance) {
      TokenSearchService.instance = new TokenSearchService();
    }
    return TokenSearchService.instance;
  }

  private calculateRelevanceScore(
    token: Token,
    query: string,
    hasPool: boolean,
  ): number {
    const lowerQuery = query.toLowerCase();
    const lowerSymbol = token.symbol.toLowerCase();
    const lowerName = (token.name || "").toLowerCase();
    const lowerAddress = token.address.toLowerCase();

    let score = 0;

    if (hasPool) {
      score += 1000;
    }

    if (lowerSymbol === lowerQuery) {
      score += 500;
    } else if (lowerSymbol.startsWith(lowerQuery)) {
      score += 300;
    } else if (lowerSymbol.includes(lowerQuery)) {
      score += 100;
    }

    if (lowerName === lowerQuery) {
      score += 400;
    } else if (lowerName.startsWith(lowerQuery)) {
      score += 200;
    } else if (lowerName.includes(lowerQuery)) {
      score += 50;
    }

    if (lowerAddress.includes(lowerQuery)) {
      score += 10;
    }

    return score;
  }

  private async updatePoolTokenAddresses(): Promise<void> {
    const now = Date.now();
    if (now - this.lastPoolUpdate < this.POOL_CACHE_TTL) {
      return;
    }

    try {
      await this.circuitBreaker.execute(
        "getAllPools",
        async () => {
          const { getAllPoolsHandler } = await import(
            "../handlers/pools/getAllPools.handler"
          );
          const poolsResult = await getAllPoolsHandler({
            includeEmpty: false,
            search: undefined,
          });

          this.poolTokenAddresses = new Set(
            poolsResult.pools.flatMap((pool) => [
              pool.tokenXMint,
              pool.tokenYMint,
            ]),
          );
          this.lastPoolUpdate = now;
        },
        {
          failureThreshold: 3,
          recoveryTimeout: 30000,
        },
      );
    } catch (error) {
      this.logger.errorWithStack(
        "Failed to update pool token addresses",
        error as Error,
      );
    }
  }

  async searchTokens(
    tokens: Token[],
    options: TokenSearchOptions = {},
  ): Promise<TokenSearchResult> {
    const startTime = performance.now();

    try {
      const {
        query = "",
        limit = 50,
        offset = 0,
        onlyWithPools = false,
      } = options;

      await this.updatePoolTokenAddresses();

      const trimmedQuery = query.trim();
      const poolAddressSet = this.poolTokenAddresses;

      let filteredTokens = tokens;

      if (onlyWithPools) {
        filteredTokens = tokens.filter((token) =>
          poolAddressSet.has(token.address),
        );
      }

      if (trimmedQuery.length > 0) {
        const scoredTokens = filteredTokens.map((token) => ({
          score: this.calculateRelevanceScore(
            token,
            trimmedQuery,
            poolAddressSet.has(token.address),
          ),
          token,
        }));

        scoredTokens.sort((a, b) => b.score - a.score);
        filteredTokens = scoredTokens.map((item) => item.token);
      } else {
        const tokensWithPools = filteredTokens.filter((token) =>
          poolAddressSet.has(token.address),
        );
        const tokensWithoutPools = filteredTokens.filter(
          (token) => !poolAddressSet.has(token.address),
        );
        filteredTokens = [...tokensWithPools, ...tokensWithoutPools];
      }

      const paginatedTokens = filteredTokens.slice(offset, offset + limit);
      const hasMore = filteredTokens.length > offset + limit;

      const result = {
        hasMore,
        poolTokenAddresses: Array.from(poolAddressSet),
        tokens: paginatedTokens,
        total: filteredTokens.length,
      };

      const duration = performance.now() - startTime;
      this.metrics.recordOperation({
        cacheHits: 0,
        cacheMisses: 1,
        duration,
        operation: "searchTokens",
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.metrics.recordOperation({
        duration,
        errorCount: 1,
        operation: "searchTokens",
      });
      throw error;
    }
  }

  getPoolTokenAddresses(): string[] {
    return Array.from(this.poolTokenAddresses);
  }

  isTokenInPool(tokenAddress: string): boolean {
    return this.poolTokenAddresses.has(tokenAddress);
  }

  clearCache(): void {
    this.poolTokenAddresses.clear();
    this.lastPoolUpdate = 0;
  }
}
