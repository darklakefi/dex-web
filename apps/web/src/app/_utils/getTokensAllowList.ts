import { tokensData, tokensDataMainnet } from "@dex-web/orpc/mocks/tokens.mock";

export const getTokensAllowList = () => {
  const list = (
    process.env.NEXT_PUBLIC_NETWORK === "2" ? tokensData : tokensDataMainnet
  ).map((token) => token.address);

  return list;
};
