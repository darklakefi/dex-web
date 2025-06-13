import { Box, Text } from "@dex-web/ui";

export function SwapForm() {
  return (
    <section className="flex w-full max-w-xl">
      <Box className="flex-col" padding="lg">
        <Box background="highlight">
          <Text.Body2 as="label" className="text-green-300 uppercase">
            Selling
          </Text.Body2>
        </Box>
        <Box background="highlight" />
      </Box>
    </section>
  );
}
