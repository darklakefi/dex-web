import { generateMockTokenMetadata } from "../generateMockTokenMetadata";

describe("generateMockTokenMetadata", () => {
  it("should generate a list of token accounts", () => {
    const response = generateMockTokenMetadata();

    expect(response).toMatchSnapshot();
    expect(response.token_info).toBeDefined();
    expect(response.token_info?.decimals).toBeDefined();
    expect(response.token_info?.symbol).toBeDefined();
  });
});
