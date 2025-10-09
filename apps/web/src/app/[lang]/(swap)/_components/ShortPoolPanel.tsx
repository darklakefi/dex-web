import type { Pool } from "@dex-web/core";
import { Box, Icon, type IconName, Text } from "@dex-web/ui";

interface ShortPoolPanelProps {
  pools: Pool[];
  title: string;
  icon: IconName;
  onPoolClick: (pool: Pool) => void;
}

export function ShortPoolPanel({
  pools,
  title,
  icon,
  onPoolClick,
}: ShortPoolPanelProps) {
  return (
    <Box
      className="flex w-full flex-col gap-5 bg-green-800"
      padding="md"
      shadow="sm"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4" name={icon} />
          <Text.Body2>{title}</Text.Body2>
        </div>
        {}
      </div>
      <div className="flex w-full flex-col gap-3">
        {pools.map((pool) => (
          <button
            className="flex w-full cursor-pointer justify-between bg-green-700 p-3 hover:opacity-80"
            key={`${pool.tokenXMint}-${pool.tokenYMint}`}
            onClick={() => onPoolClick(pool)}
            type="button"
          >
            <div className="flex gap-1">
              <Text.Body2 className="text-green-300">
                {pool.tokenXSymbol}
              </Text.Body2>
              <span className="text-green-300">/</span>
              <Text.Body2 className="text-green-300">
                {pool.tokenYSymbol}
              </Text.Body2>
            </div>

            {}
          </button>
        ))}
      </div>
    </Box>
  );
}
