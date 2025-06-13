import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const tokenMetadata = pgTable("token_metadata", {
  created_at: timestamp("created_at").defaultNow().notNull(),
  decimals: integer("decimals").notNull(),
  name: varchar("name").notNull(),
  symbol: varchar("symbol").notNull(),
  token_address: varchar("token_address").primaryKey(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  uri: varchar("uri"),
});
