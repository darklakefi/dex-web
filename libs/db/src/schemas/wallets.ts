import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const wallets = pgTable("wallets", {
  chain: varchar("chain").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  id: varchar("id").primaryKey(),
  label: varchar("label").notNull(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  wallet_address: varchar("wallet_address", { length: 44 }).notNull(),
});
