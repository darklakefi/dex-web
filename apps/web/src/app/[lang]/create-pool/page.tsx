import { tanstackClient } from "@dex-web/orpc";
import { Box, Hero, Text } from "@dex-web/ui";
import { QueryClient } from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { MOCK_OWNER_ADDRESS } from "../../_utils/constants";
import { selectedTokensCache } from "../../_utils/searchParams";
import { CreatePoolForm } from "./_components/CreatePoolForm";

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await selectedTokensCache.parse(searchParams);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(
    tanstackClient.helius.getTokenAccounts.queryOptions({
      input: { ownerAddress: MOCK_OWNER_ADDRESS },
    }),
  );

  return (
    <div className="flex justify-center gap-12">
      <div className="flex max-w-xl flex-col items-center justify-center">
        <section className="flex w-full items-start gap-1">
          <div className="size-9" />
          <Text.Heading className="mb-4 block md:hidden">
            Create Pool
          </Text.Heading>
          <Box className="mb-0 hidden bg-green-800 pb-0 md:block">
            <Hero
              className="gap-4"
              image="/images/waddles/pose3.png"
              imagePosition="end"
            >
              <div className="flex flex-col gap-3 uppercase">
                <Text.Heading>create pool</Text.Heading>
                <div className="flex flex-col text-md">
                  <Text.Body2 className="text-md md:text-lg">
                    Initialize a new trading pair
                  </Text.Body2>
                  <Text.Body2 className="text-green-300 text-md md:text-lg">
                    and set the initial price.
                  </Text.Body2>
                </div>
              </div>
            </Hero>
          </Box>

          <div className="size-9" />
        </section>
        <CreatePoolForm />
      </div>
    </div>
  );
}
