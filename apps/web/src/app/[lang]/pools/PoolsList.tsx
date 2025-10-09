"use client";

import { tanstackClient } from "@dex-web/orpc";
import { Box, Text } from "@dex-web/ui";
import { useQuery } from "@tanstack/react-query";

export function PoolsList() {
  const { data, isLoading, error } = useQuery({
    ...tanstackClient.pools.getAllPools.queryOptions({
      input: {
        includeEmpty: true,
        limit: 20,
      },
    }),
  });

  if (isLoading) {
    return (
      <Box>
        <Text variant="body2">Loading pools...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="bg-red-900/20">
        <Text className="text-red-300" variant="body2">
          Error loading pools: {error.message}
        </Text>
        <pre className="mt-2 overflow-auto text-xs">
          {JSON.stringify(error, null, 2)}
        </pre>
      </Box>
    );
  }

  if (!data || data.pools.length === 0) {
    return (
      <Box>
        <Text variant="body2">No pools found (Total: {data?.total || 0})</Text>
        <Text className="mt-2 text-green-300 text-xs" variant="body2">
          This might mean:
        </Text>
        <ul className="mt-1 ml-4 list-disc text-green-300 text-xs">
          <li>No pools exist on-chain for this program</li>
          <li>All pools are empty (try includeEmpty: true)</li>
          <li>RPC connection issue</li>
        </ul>
        <details className="mt-4">
          <summary className="cursor-pointer text-green-300 text-sm">
            Debug Info
          </summary>
          <pre className="mt-2 overflow-auto text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </Box>
    );
  }

  return (
    <div className="space-y-4">
      <Box>
        <Text className="mb-4" variant="heading">
          All Pools ({data.total})
        </Text>
        <div className="space-y-2">
          {data.pools.map((pool) => (
            <Box className="bg-green-900/20" key={pool.address}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Text className="text-green-300" variant="body2">
                    Pool Address
                  </Text>
                  <Text className="font-mono text-xs" variant="body2">
                    {pool.address.slice(0, 8)}...{pool.address.slice(-8)}
                  </Text>
                </div>
                <div>
                  <Text className="text-green-300" variant="body2">
                    Tokens
                  </Text>
                  <Text variant="body2">
                    {pool.tokenXSymbol || "?"} / {pool.tokenYSymbol || "?"}
                  </Text>
                </div>
                <div>
                  <Text className="text-green-300" variant="body2">
                    Token X Locked
                  </Text>
                  <Text variant="body2">{pool.lockedX}</Text>
                </div>
                <div>
                  <Text className="text-green-300" variant="body2">
                    Token Y Locked
                  </Text>
                  <Text variant="body2">{pool.lockedY}</Text>
                </div>
                <div>
                  <Text className="text-green-300" variant="body2">
                    LP Supply
                  </Text>
                  <Text variant="body2">{pool.lpTokenSupply}</Text>
                </div>
              </div>
            </Box>
          ))}
        </div>
      </Box>
    </div>
  );
}
