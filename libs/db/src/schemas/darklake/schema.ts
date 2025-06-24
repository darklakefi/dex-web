import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const aggregationPeriod = pgEnum("aggregation_period", [
  "1h",
  "day",
  "week",
  "month",
]);

export const darklakeTransactionType = pgEnum("darklake_transaction_type", [
  "init",
  "deposit",
  "withdraw",
  "swap",
]);

export const darklakeTransactions = pgTable(
  "darklake_transactions",
  {
    amountX: numeric("amount_x", { precision: 38, scale: 0 }).notNull(),
    amountY: numeric("amount_y", { precision: 38, scale: 0 }).notNull(),
    blockNumber: numeric("block_number", { precision: 38, scale: 0 }).notNull(),
    blockTimestamp: timestamp("block_timestamp", {
      withTimezone: true,
    }).notNull(),
    feeLp: numeric("fee_lp", { precision: 38, scale: 0 }).notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull(),
    isXToY: boolean("is_x_to_y").notNull(),
    mintLp: varchar("mint_lp", { length: 44 }).notNull(),
    reservesX: numeric("reserves_x", { precision: 38, scale: 0 }).notNull(),
    reservesY: numeric("reserves_y", { precision: 38, scale: 0 }).notNull(),
    signerAddress: varchar("signer_address", { length: 44 }).notNull(),
    tokenMintX: varchar("token_mint_x", { length: 44 }).notNull(),
    tokenMintY: varchar("token_mint_y", { length: 44 }).notNull(),
    totalUsdValue: numeric("total_usd_value", {
      precision: 24,
      scale: 8,
    }).notNull(),
    transactionType: darklakeTransactionType("transaction_type").notNull(),

    txHash: varchar("tx_hash", { length: 88 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.txHash] }),
  }),
);

export const pairVolumeAggregates = pgTable(
  "pair_volume_aggregates",
  {
    feeUsdTotal: numeric("fee_usd_total", {
      precision: 24,
      scale: 8,
    }).notNull(),
    feeUsdXToY: numeric("fee_usd_x_to_y", {
      precision: 24,
      scale: 8,
    }).notNull(),
    feeUsdYToX: numeric("fee_usd_y_to_x", {
      precision: 24,
      scale: 8,
    }).notNull(),

    mintLp: varchar("mint_lp", { length: 44 }).notNull(),
    period: aggregationPeriod("period").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),

    swapCountTotal: numeric("swap_count_total", {
      precision: 38,
      scale: 0,
    }).notNull(),
    swapCountXToY: numeric("swap_count_x_to_y", {
      precision: 38,
      scale: 0,
    }).notNull(),
    swapCountYToX: numeric("swap_count_y_to_x", {
      precision: 38,
      scale: 0,
    }).notNull(),

    volumeUsdTotal: numeric("volume_usd_total", {
      precision: 24,
      scale: 8,
    }).notNull(),
    volumeUsdXToY: numeric("volume_usd_x_to_y", {
      precision: 24,
      scale: 8,
    }).notNull(),
    volumeUsdYToX: numeric("volume_usd_y_to_x", {
      precision: 24,
      scale: 8,
    }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.period, t.periodStart, t.mintLp] }),
  }),
);

export const tokenVolumeAggregates = pgTable(
  "token_volume_aggregates",
  {
    feeUsdTotal: numeric("fee_usd_total", {
      precision: 24,
      scale: 8,
    }).notNull(),
    feeUsdXToY: numeric("fee_usd_x_to_y", {
      precision: 24,
      scale: 8,
    }).notNull(),
    feeUsdYToX: numeric("fee_usd_y_to_x", {
      precision: 24,
      scale: 8,
    }).notNull(),
    period: aggregationPeriod("period").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),

    swapCountTotal: numeric("swap_count_total", {
      precision: 38,
      scale: 0,
    }).notNull(),
    swapCountXToY: numeric("swap_count_x_to_y", {
      precision: 38,
      scale: 0,
    }).notNull(),
    swapCountYToX: numeric("swap_count_y_to_x", {
      precision: 38,
      scale: 0,
    }).notNull(),

    tokenMint: varchar("token_mint", { length: 44 }).notNull(),
    usdTokenPrice: numeric("usd_token_price", {
      precision: 24,
      scale: 8,
    }).notNull(),

    volumeUsdTotal: numeric("volume_usd_total", {
      precision: 24,
      scale: 8,
    }).notNull(),

    volumeUsdXToY: numeric("volume_usd_x_to_y", {
      precision: 24,
      scale: 8,
    }).notNull(),

    volumeUsdYToX: numeric("volume_usd_y_to_x", {
      precision: 24,
      scale: 8,
    }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.period, t.periodStart, t.tokenMint] }),
  }),
);

export const pairTvlAggregates = pgTable(
  "pair_tvl_aggregates",
  {
    mintLp: varchar("mint_lp", { length: 44 }).notNull(),
    period: aggregationPeriod("period").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    tvlChangeUsd: numeric("tvl_change_usd", {
      precision: 24,
      scale: 8,
    }).notNull(),
    tvlEndUsd: numeric("tvl_end_usd", { precision: 24, scale: 8 }).notNull(),

    tvlStartUsd: numeric("tvl_start_usd", {
      precision: 24,
      scale: 8,
    }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.period, t.periodStart, t.mintLp] }),
  }),
);

export const tokenTvlAggregates = pgTable(
  "token_tvl_aggregates",
  {
    period: aggregationPeriod("period").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),

    tokenMint: varchar("token_mint", { length: 44 }).notNull(),
    totalTokensLocked: numeric("total_tokens_locked", {
      precision: 38,
      scale: 0,
    }).notNull(),
    tvlChangeUsd: numeric("tvl_change_usd", {
      precision: 24,
      scale: 8,
    }).notNull(),
    tvlEndUsd: numeric("tvl_end_usd", { precision: 24, scale: 8 }).notNull(),

    tvlStartUsd: numeric("tvl_start_usd", {
      precision: 24,
      scale: 8,
    }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.period, t.periodStart, t.tokenMint] }),
  }),
);

export const dexVolumeAggregates = pgTable(
  "dex_volume_aggregates",
  {
    period: aggregationPeriod("period").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),

    swapCount: numeric("swap_count", { precision: 38, scale: 0 }).notNull(),
    totalFeeUsd: numeric("total_fee_usd", {
      precision: 24,
      scale: 8,
    }).notNull(),

    totalVolumeUsd: numeric("total_volume_usd", {
      precision: 24,
      scale: 8,
    }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.period, t.periodStart] }),
  }),
);

export const dexTvlAggregates = pgTable(
  "dex_tvl_aggregates",
  {
    period: aggregationPeriod("period").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    tvlChangeUsd: numeric("tvl_change_usd", {
      precision: 24,
      scale: 8,
    }).notNull(),
    tvlEndUsd: numeric("tvl_end_usd", { precision: 24, scale: 8 }).notNull(),

    tvlStartUsd: numeric("tvl_start_usd", {
      precision: 24,
      scale: 8,
    }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.period, t.periodStart] }),
  }),
);
