import { searchAssetsHandler } from "./searchAssets.handler";

import "../../../mocks/helius.mock";

describe("searchAssestsHandler", () => {
  it("should return a list of assets", async () => {
    const result = await searchAssetsHandler({
      input: {
        cursor: "123",
        limit: 10,
      },
    });

    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });
});
