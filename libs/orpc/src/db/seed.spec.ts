import { describe, it } from "vitest";
import {
  generateBlockQueueData,
  generateSandwichEvents,
  generateSolanaAddress,
  generateTokenMetadata,
  generateTxHash,
} from "./seed";

describe("generateSolanaAddress ", () => {
  it("should generate a solana address", () => {
    const address = generateSolanaAddress();
    expect(address).toBeDefined();
    expect(address).toHaveLength(44);
  });
});

describe("generateTxHash ", () => {
  it("should generate a tx hash", () => {
    const hash = generateTxHash();
    expect(hash).toBeDefined();
    expect(hash).toHaveLength(88);
  });
});

describe("generateBlockQueueData ", () => {
  it("should generate a block queue data", () => {
    const data = generateBlockQueueData(10);
    expect(data).toBeDefined();
    expect(data).toHaveLength(10);
  });
});

describe("generateTokenMetadata ", () => {
  it("should generate a token metadata", () => {
    const data = generateTokenMetadata(10);
    expect(data).toBeDefined();
    expect(data).toHaveLength(10);
  });
});

describe("generateSandwichEvents ", () => {
  it("should generate a sandwich events", () => {
    const data = generateSandwichEvents(10, [], [BigInt(1)]);
    expect(data).toBeDefined();
    expect(data).toHaveLength(10);
  });
});
