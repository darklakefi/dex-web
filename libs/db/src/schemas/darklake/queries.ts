import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { database } from "../../database";
import {
  darklakeTransactions,
  dexVolumeAggregates,
  pairVolumeAggregates,
} from "./schema";

export const darklakeQueries = {
  getPairVolumeInRange: (mintLp: string, startDate: Date, endDate: Date) =>
    database
      .select()
      .from(pairVolumeAggregates)
      .where(
        and(
          eq(pairVolumeAggregates.mintLp, mintLp),
          gte(pairVolumeAggregates.periodStart, startDate),
          lte(pairVolumeAggregates.periodStart, endDate),
        ),
      )
      .orderBy(asc(pairVolumeAggregates.periodStart)),
  getRecentTransactions: (limit = 100) =>
    database
      .select()
      .from(darklakeTransactions)
      .orderBy(desc(darklakeTransactions.blockTimestamp))
      .limit(limit),

  getTransactionsByPair: (mintLp: string, limit = 100) =>
    database
      .select()
      .from(darklakeTransactions)
      .where(eq(darklakeTransactions.mintLp, mintLp))
      .orderBy(desc(darklakeTransactions.blockTimestamp))
      .limit(limit),

  getVolumeAggregates: (period: "1h" | "day" | "week" | "month") =>
    database
      .select()
      .from(dexVolumeAggregates)
      .where(eq(dexVolumeAggregates.period, period))
      .orderBy(desc(dexVolumeAggregates.periodStart)),
};
