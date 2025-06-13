import type { NewConfig } from "../../schema/types";

export const configSeedData = [
  {
    key: "block_processing_enabled",
    value: "true",
  },
  {
    key: "max_block_queue_size",
    value: "1000",
  },
  {
    key: "sandwich_detection_threshold",
    value: "0.05",
  },
  {
    key: "supported_dexes",
    value: "raydium,orca,jupiter",
  },
] satisfies NewConfig[];

export function generateMockConfig() {
  return configSeedData;
}
