import { tokensData, tokensDataMainnet } from "@dex-web/orpc/mocks/tokens.mock";

export const getTokensAllowList = () => {
  const list = (
    process.env.NETWORK === "2" ? tokensData : tokensDataMainnet
  ).map((token) => token.address);

  console.log({ list });

  return list;
};
