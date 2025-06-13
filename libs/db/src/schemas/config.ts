import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const config = pgTable("config", {
  created_at: timestamp("created_at").defaultNow().notNull(),
  key: varchar("key").primaryKey().unique(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  value: varchar("value").notNull(),
});
