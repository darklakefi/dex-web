import { FIXED_SEED } from "../constants";
import { generateMockSwap } from "../generateMockSwap";

describe("generateMockSwap", () => {
  it("should generate a swap", () => {
    const response = generateMockSwap(FIXED_SEED);

    expect(response).toMatchSnapshot();
    expect(response.buyAmount).toBeDefined();
    expect(response.buyBalance).toBeDefined();
    expect(response.buyToken).toBeDefined();
    expect(response.estimatedFeesUsd).toBeDefined();
    expect(response.exchangeRate).toBeDefined();
    expect(response.mevProtectionEnabled).toBeDefined();
    expect(response.priceImpactPercentage).toBeDefined();
    expect(response.sellAmount).toBeDefined();
  });
});
