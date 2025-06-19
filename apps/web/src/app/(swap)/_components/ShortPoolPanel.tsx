import type { Pool } from "@dex-web/core";
import { Box, Icon, type IconName, Text } from "@dex-web/ui";

interface ShortPoolPanelProps {
  pools: Pool[];
  title: string;
  icon: IconName;
}

export function ShortPoolPanel({ pools, title, icon }: ShortPoolPanelProps) {
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
        <div className="flex items-center gap-2">
          <Text.Body2 className="text-green-300">24H APR</Text.Body2>
          <Icon className="text-green-300" name="chevron-down" />
        </div>
      </div>
      <div className="flex w-full flex-col gap-3">
        {pools.map((pool) => (
          <div
            className="flex w-full justify-between bg-green-700 p-3"
            key={pool.address}
          >
            <div className="flex text-green-300">
              <Text.Body2 className="text-green-300">
                {pool.tokenX.symbol}
              </Text.Body2>
              /
              <Text.Body2 className="text-green-300">
                {pool.tokenY.symbol}
              </Text.Body2>
            </div>

            <Text.Body2 className="text-green-100">{pool.apr}%</Text.Body2>
          </div>
        ))}
      </div>
    </Box>
  );
}
