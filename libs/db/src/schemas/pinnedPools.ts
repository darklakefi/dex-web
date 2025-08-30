import {
  doublePrecision,
  pgTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const pinnedPools = pgTable(
  "pinned_pools",
  {
    apr: doublePrecision("apr").notNull(),
    chain: varchar("chain").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    token_x_mint: varchar("token_x_mint", { length: 44 }).notNull(),
    token_x_symbol: varchar("token_x_symbol").notNull(),
    token_y_mint: varchar("token_y_mint", { length: 44 }).notNull(),
    token_y_symbol: varchar("token_y_symbol").notNull(),
    updated_at: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("pinned_pools_token_pair_unique").on(
      table.token_x_mint,
      table.token_y_mint,
    ),
  ],
);
