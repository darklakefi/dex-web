import { bigint, pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const blockQueueStatusEnum = pgEnum("BlockQueueStatus", [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const blockQueue = pgTable("block_queue", {
  slot: bigint("slot", { mode: "bigint" }).primaryKey().unique(),
  status: blockQueueStatusEnum("status").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const insertBlockQueueSchema = createInsertSchema(blockQueue);
export const selectBlockQueueSchema = createSelectSchema(blockQueue);

export const blockQueueStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
