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

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const blockQueueStatusEnum = pgEnum("BlockQueueStatus", [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
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
    txHashVictimSwap: varchar("tx_hash_victim_swap").notNull(),
    txHashAttackerBuy: varchar("tx_hash_attacker_buy").notNull(),
    txHashAttackerSell: varchar("tx_hash_attacker_sell").notNull(),
    tokenAddress: varchar("token_address").notNull(),
    attackerAddress: varchar("attacker_address").notNull(),
    victimAddress: varchar("victim_address").notNull(),
    lpAddress: varchar("lp_address").notNull(),
    dexName: varchar("dex_name").notNull(),
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
  tokenAddress: varchar("token_address").primaryKey(),
  name: varchar("name").notNull(),
  symbol: varchar("symbol").notNull(),
  decimals: integer("decimals").notNull(),
  uri: varchar("uri"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Config = typeof config.$inferSelect;
export type NewConfig = typeof config.$inferInsert;

export type BlockQueue = typeof blockQueue.$inferSelect;
export type NewBlockQueue = typeof blockQueue.$inferInsert;

export type SandwichEvent = typeof sandwichEvent.$inferSelect;
export type NewSandwichEvent = typeof sandwichEvent.$inferInsert;

export type TokenMetadata = typeof tokenMetadata.$inferSelect;
export type NewTokenMetadata = typeof tokenMetadata.$inferInsert;
