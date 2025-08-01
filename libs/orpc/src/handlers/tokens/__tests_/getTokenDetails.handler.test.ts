import { getTokenDetailsHandler } from "../getTokenDetails.handler";

describe("getTokensHandler", () => {
  it.skip("should return a token details", async () => {
    const result = await getTokenDetailsHandler({
      address: "So11111111111111111111111111111111111111112",
    });

    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });
});
