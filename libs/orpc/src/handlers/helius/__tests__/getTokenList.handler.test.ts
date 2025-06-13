import { getTokenListHandler } from "../getTokenList.handler";

describe("getTokenListHandler", () => {
  it("should return a list of assets", async () => {
    const result = await getTokenListHandler({
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });
});
