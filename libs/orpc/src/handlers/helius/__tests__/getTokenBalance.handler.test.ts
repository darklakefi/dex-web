import { randUuid, seed } from "@ngneat/falso";
import { FIXED_SEED } from "../../../mocks/helpers/constants";
import { getTokenBalanceHandler } from "../getTokenBalance.handler";

describe("getTokenBalanceHandler", () => {
  seed(FIXED_SEED);
  const ownerAddress = randUuid();

  it("should return a list of assets", async () => {
    const result = await getTokenBalanceHandler({
      ownerAddress,
    });

    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });
});
