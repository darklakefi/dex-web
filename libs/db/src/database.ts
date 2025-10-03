import "dotenv/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const database: NodePgDatabase = drizzle(process.env.DATABASE_URL);
