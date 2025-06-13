import { describe, expect, it } from "vitest";
import { generateMockSandwichEvents } from "../generateMockSandwichEvents";

describe("generateMockSandwichEvents", () => {
  it("should generate mock sandwich events", () => {
    const sandwichEvents = generateMockSandwichEvents(
      10,
      ["0x1234567890123456789012345678901234567890"],
      [BigInt(12345678901234567890n)],
    );
    expect(sandwichEvents).toHaveLength(10);
    expect(sandwichEvents[0]?.attacker_address).toBeTypeOf("string");
    expect(sandwichEvents[0]?.dex_name).toBeTypeOf("string");
    expect(sandwichEvents[0]?.lp_address).toBeTypeOf("string");
    expect(sandwichEvents[0]?.occurred_at).toBeInstanceOf(Date);
    expect(sandwichEvents[0]?.slot).toBeTypeOf("bigint");
    expect(sandwichEvents[0]?.sol_amount_drained).toBeTypeOf("bigint");
    expect(sandwichEvents[0]?.sol_amount_swap).toBeTypeOf("bigint");
  });
});
