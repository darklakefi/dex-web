import { describe, expect, it } from "vitest";
import { parseJWT } from "./parseJwt";

describe("parseJWT", () => {
  it("should parse a jwt token", () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const payload = parseJWT(token);
    expect(payload).toEqual({
      sub: "1234567890",
      name: "John Doe",
      iat: 1516239022,
    });
  });
});
