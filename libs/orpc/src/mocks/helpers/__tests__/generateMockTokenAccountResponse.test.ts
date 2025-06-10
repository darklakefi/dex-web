import { generateTokenAccountsResponseList } from "../generateMockTokenAccountResponse";

describe("generateTokenAccountsResponseList", () => {
  it("should generate a list of token accounts", () => {
    const response = generateTokenAccountsResponseList();

    expect(response).toMatchSnapshot();
    expect(response.token_accounts).toBeDefined();
    expect(response.token_accounts?.length).toBe(10);
  });
});
