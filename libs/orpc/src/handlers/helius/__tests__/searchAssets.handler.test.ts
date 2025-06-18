import { searchAssetsHandler } from "../searchAssets.handler";

describe("searchAssetsHandler", () => {
  it("should return a list of assets", async () => {
    const result = await searchAssetsHandler({
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });
});
