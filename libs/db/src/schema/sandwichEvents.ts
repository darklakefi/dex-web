import {
  bigint,
  index,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const sandwichEvents = pgTable(
  "sandwich_events",
  {
    slot: bigint("slot", { mode: "bigint" }).notNull(),
    sol_amount_drained: bigint("sol_amount_drained", {
      mode: "bigint",
    }).notNull(),
    sol_amount_swap: bigint("sol_amount_swap", { mode: "bigint" }).notNull(),
    tx_hash_victim_swap: varchar("tx_hash_victim_swap").notNull(),
    tx_hash_attacker_buy: varchar("tx_hash_attacker_buy").notNull(),
    tx_hash_attacker_sell: varchar("tx_hash_attacker_sell").notNull(),
    token_address: varchar("token_address").notNull(),
    attacker_address: varchar("attacker_address").notNull(),
    victim_address: varchar("victim_address").notNull(),
    lp_address: varchar("lp_address").notNull(),
    dex_name: varchar("dex_name").notNull(),
    occurred_at: timestamp("occurred_at").notNull(),
    added_at: timestamp("added_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.tx_hash_victim_swap,
        table.token_address,
        table.attacker_address,
        table.victim_address,
      ],
    }),
    victimAddressIdx: index("victim_address_idx").on(table.victim_address),
    tokenAddressIdx: index("token_address_idx").on(table.token_address),
    occurredAtIdx: index("occurred_at_idx").on(table.occurred_at),
    victimAddressOccurredAtIdx: index("victim_address_occurred_at_idx").on(
      table.victim_address,
      table.occurred_at,
    ),
  }),
);

export const insertSandwichEventSchema = createInsertSchema(sandwichEvents);
export const selectSandwichEventSchema = createSelectSchema(sandwichEvents);
