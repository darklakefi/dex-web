import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const pinnedPools = pgTable("pinned_pools", {
  created_at: timestamp("created_at").defaultNow().notNull(),
  id: varchar("id").primaryKey(),
  is_active: boolean("is_active").default(true).notNull(),
  pool_address: varchar("pool_address", { length: 44 }).notNull(),
  pool_name: varchar("pool_name"),
  token_a: varchar("token_a", { length: 44 }).notNull(),
  token_b: varchar("token_b", { length: 44 }).notNull(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
