import { randUuid } from "@ngneat/falso";
import { getTokenBalanceHandler } from "../getTokenBalance.handler";

describe("getTokenBalanceHandler", () => {
  const ownerAddress = randUuid();

  it("should return a list of assets", async () => {
    const result = await getTokenBalanceHandler({
      ownerAddress,
    });

    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });
});
