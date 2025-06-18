import { describe, expect, it } from "vitest";
import { generateMockBlockQueueData } from "../generateMockBlockQueueData";

describe("generateMockBlockQueueData", () => {
  it("should generate mock block queue data", () => {
    const blockQueueData = generateMockBlockQueueData(10);
    expect(blockQueueData).toHaveLength(10);
    expect(blockQueueData[0]?.slot).toBeTypeOf("bigint");
    expect(blockQueueData[0]?.status).toBeTypeOf("string");
  });
});
