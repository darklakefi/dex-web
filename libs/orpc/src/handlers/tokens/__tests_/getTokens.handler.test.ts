import { getTokensHandler } from "../getTokens.handler";

describe("getTokensHandler", () => {
  it.skip("should return a list of assets", async () => {
    const result = await getTokensHandler({
      limit: 10,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });
});
