import { getTokenListHandler } from "../getTokenList.handler";

describe("getTokenListHandler", () => {
  it("should return a list of assets", async () => {
    const result = await getTokenListHandler({
      input: {
        cursor: "123",
        limit: 10,
      },
    });

    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });
});
