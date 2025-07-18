import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const tokens = pgTable("tokens", {
  created_at: timestamp("created_at").defaultNow().notNull(),
  image_url: varchar("image_url").notNull(),
  name: varchar("name").notNull(),
  symbol: varchar("symbol").notNull(),
  token_address: varchar("token_address").primaryKey(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
