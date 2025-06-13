import { bigint, pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";

export const blockQueueStatusEnum = pgEnum("BlockQueueStatus", [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const blockQueue = pgTable("block_queue", {
  created_at: timestamp("created_at").defaultNow().notNull(),
  slot: bigint("slot", { mode: "bigint" }).primaryKey().unique(),
  status: blockQueueStatusEnum("status").notNull(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
