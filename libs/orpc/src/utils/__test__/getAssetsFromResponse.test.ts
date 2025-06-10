import { generateAssetResponseList } from "@/mocks/helpers/generateMockAssetResponseList";
import { getAssetsFromResponse } from "../getAssetsFromResponse";

const mockAssetsFromResponse = generateAssetResponseList();

describe("getAssetsFromResponse", () => {
  it("should return a list of assets", () => {
    const response = getAssetsFromResponse(mockAssetsFromResponse);

    expect(response).toMatchSnapshot();
    expect(response.length).toBe(mockAssetsFromResponse.items.length);
  });
});
