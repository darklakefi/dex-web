import { generateAssetResponseList } from "../generateMockAssetResponseList";

describe("generateAssetResponseList", () => {
  it("should generate a list of assets", () => {
    const response = generateAssetResponseList();

    expect(response).toMatchSnapshot();
    expect(response.items.length).toBe(10);
  });
});
