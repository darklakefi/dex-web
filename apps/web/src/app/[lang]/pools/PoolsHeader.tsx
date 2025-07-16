import { Box, Button, Text } from "@dex-web/ui";
import { useTranslations } from "next-intl";

interface PoolsHeaderProps {
  tvl: string;
  volume: string;
  fees: string;
}

export function PoolsHeader({ tvl, volume, fees }: PoolsHeaderProps) {
  const tx = useTranslations("pages");

  return (
    <div>
      <div className="mb-10 flex flex-row items-center justify-between md:hidden">
        <Text variant="heading">{tx("pools")}</Text>
        <div className="flex items-center">
          <Button variant="secondary">Create Pool</Button>
        </div>
      </div>
      <Box className="flex flex-row items-center justify-between gap-4">
        <div className="hidden md:block">
          <Text variant="heading">{tx("pools")}</Text>
        </div>
        <div className="flex w-full flex-row justify-center gap-16 md:justify-end">
          <dl className="flex flex-row gap-16">
            <div>
              <dt>
                <Text className="text-green-200" variant="body2">
                  {tvl}
                </Text>
              </dt>
              <dd>
                <Text className="text-green-300" variant="body2">
                  TVL
                </Text>
              </dd>
            </div>
            <div>
              <dt>
                <Text className="text-green-200" variant="body2">
                  {volume}
                </Text>
              </dt>
              <dd>
                <Text className="text-green-300" variant="body2">
                  24H Volume
                </Text>
              </dd>
            </div>
            <div>
              <dt>
                <Text className="text-green-200" variant="body2">
                  {fees}
                </Text>
              </dt>
              <dd>
                <Text className="text-green-300" variant="body2">
                  24H Fees
                </Text>
              </dd>
            </div>
          </dl>
          <div className="hidden items-center md:flex">
            <Button variant="secondary">Create Pool</Button>
          </div>
        </div>
      </Box>
    </div>
  );
}
