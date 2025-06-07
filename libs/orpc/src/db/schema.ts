import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  age: z.number(),
  email: z.string(),
});

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const blockQueueStatusEnum = pgEnum("block_queue_status", [
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const config = pgTable("config", {
  key: varchar("key").primaryKey().unique(),
  value: varchar("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blockQueue = pgTable("block_queue", {
  slot: bigint("slot", { mode: "bigint" }).primaryKey().unique(),
  status: blockQueueStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sandwichEvent = pgTable(
  "sandwich_events",
  {
    slot: bigint("slot", { mode: "bigint" }).notNull(),
    solAmountDrained: bigint("sol_amount_drained", {
      mode: "bigint",
    }).notNull(),
    solAmountSwap: bigint("sol_amount_swap", { mode: "bigint" }).notNull(),
    txHashVictimSwap: varchar("tx_hash_victim_swap", { length: 88 }).notNull(),
    txHashAttackerBuy: varchar("tx_hash_attacker_buy", {
      length: 88,
    }).notNull(),
    txHashAttackerSell: varchar("tx_hash_attacker_sell", {
      length: 88,
    }).notNull(),
    tokenAddress: varchar("token_address", { length: 44 }).notNull(),
    attackerAddress: varchar("attacker_address", { length: 44 }).notNull(),
    victimAddress: varchar("victim_address", { length: 44 }).notNull(),
    lpAddress: varchar("lp_address", { length: 44 }).notNull(),
    dexName: varchar("dex_name", { length: 50 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.txHashVictimSwap,
        table.tokenAddress,
        table.attackerAddress,
        table.victimAddress,
      ],
    }),
    victimAddressIdx: index("sandwich_events_victim_address_idx").on(
      table.victimAddress,
    ),
    tokenAddressIdx: index("sandwich_events_token_address_idx").on(
      table.tokenAddress,
    ),
    attackerAddressIdx: index("sandwich_events_attacker_address_idx").on(
      table.attackerAddress,
    ),
    slotIdx: index("sandwich_events_slot_idx").on(table.slot),
    occurredAtIdx: index("sandwich_events_occurred_at_idx").on(
      table.occurredAt,
    ),
    victimOccurredIdx: index("sandwich_events_victim_occurred_idx").on(
      table.victimAddress,
      table.occurredAt,
    ),
  }),
);

export const tokenMetadata = pgTable("token_metadata", {
  tokenAddress: varchar("token_address", { length: 44 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  decimals: integer("decimals").notNull(),
  uri: varchar("uri", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sandwichEventRelations = relations(sandwichEvent, ({ one }) => ({
  tokenMetadata: one(tokenMetadata, {
    fields: [sandwichEvent.tokenAddress],
    references: [tokenMetadata.tokenAddress],
  }),
  blockQueue: one(blockQueue, {
    fields: [sandwichEvent.slot],
    references: [blockQueue.slot],
  }),
}));

export const tokenMetadataRelations = relations(tokenMetadata, ({ many }) => ({
  sandwichEvents: many(sandwichEvent),
}));

export const blockQueueRelations = relations(blockQueue, ({ many }) => ({
  sandwichEvents: many(sandwichEvent),
}));

export type Config = typeof config.$inferSelect;
export type NewConfig = typeof config.$inferInsert;
export type BlockQueue = typeof blockQueue.$inferSelect;
export type NewBlockQueue = typeof blockQueue.$inferInsert;
export type SandwichEvent = typeof sandwichEvent.$inferSelect;
export type NewSandwichEvent = typeof sandwichEvent.$inferInsert;
export type TokenMetadata = typeof tokenMetadata.$inferSelect;
export type NewTokenMetadata = typeof tokenMetadata.$inferInsert;

export const insertConfigSchema = createInsertSchema(config);
export const selectConfigSchema = createSelectSchema(config);

export const insertBlockQueueSchema = createInsertSchema(blockQueue);
export const selectBlockQueueSchema = createSelectSchema(blockQueue);

export const insertSandwichEventSchema = createInsertSchema(sandwichEvent);
export const selectSandwichEventSchema = createSelectSchema(sandwichEvent);

export const insertTokenMetadataSchema = createInsertSchema(tokenMetadata);
export const selectTokenMetadataSchema = createSelectSchema(tokenMetadata);
