import { generateTokenAccountsResponseList } from "../../mocks/helpers/generateMockTokenAccountResponse";
import { getTokenAccountsFromResponse } from "../getTokenAccountsFromResponse";

const mockTokenAccountsFromResponse = generateTokenAccountsResponseList();

describe("getTokenAccountsFromResponse", () => {
  it("should return a list of assets", () => {
    const response = getTokenAccountsFromResponse(
      mockTokenAccountsFromResponse,
    );

    expect(response).toMatchSnapshot();
    expect(response?.length).toBe(
      mockTokenAccountsFromResponse.token_accounts?.length,
    );
  });
});
