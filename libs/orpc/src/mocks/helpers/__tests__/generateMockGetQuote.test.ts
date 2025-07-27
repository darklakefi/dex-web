import { FIXED_SEED } from "../constants";
import { generateMockGetQuote } from "../generateMockGetQuote";

describe("generateMockGetQuote", () => {
  it("should generate a quote", () => {
    const response = generateMockGetQuote(FIXED_SEED);

    expect(response).toMatchSnapshot();
    expect(response.tokenX).toBeDefined();
    expect(response.tokenY).toBeDefined();
    expect(response.poolAddress).toBeDefined();
    expect(response.amountOut).toBeDefined();
    expect(response.isXtoY).toBeDefined();
    expect(response.rateXtoY).toBeDefined();
    expect(response.slippage).toBeDefined();
    expect(response.estimatedFee).toBeDefined();
    expect(response.estimatedFeesUsd).toBeDefined();
    expect(response.priceImpactPercentage).toBeDefined();
    expect(response.deadline).toBeDefined();
    expect(response.userAddress).toBeDefined();
  });
});
