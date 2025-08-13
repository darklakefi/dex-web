import { randUuid, seed } from "@ngneat/falso";
import { FIXED_SEED } from "../../../mocks/helpers/constants";
import { getTokenAccountsHandler } from "../getTokenAccounts.handler";

describe.skip("getTokenAccountsHandler", () => {
  seed(FIXED_SEED);
  const ownerAddress = randUuid();

  it("should return a list of assets", async () => {
    const result = await getTokenAccountsHandler({
      ownerAddress,
    });

    expect(result).toBeDefined();
    expect(result).toMatchSnapshot();
  });
});
