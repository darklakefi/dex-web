import type { NewBlockQueue } from "../../schemas/types";

export function generateMockBlockQueueData(count: number): NewBlockQueue[] {
  const statuses = ["QUEUED", "PROCESSING", "COMPLETED", "FAILED"] as const;

  return Array.from({ length: count }, (_, i) => ({
    slot: BigInt(200000000 + i),
    status: statuses[Math.floor(Math.random() * statuses.length)] ?? "QUEUED",
  }));
}
