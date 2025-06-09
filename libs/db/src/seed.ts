import {
  randAlphaNumeric,
  randCompanyName,
  randNumber,
  randRecentDate,
  randUrl,
} from "@ngneat/falso";
import { database } from ".";
import {
  type NewBlockQueue,
  type NewConfig,
  type NewSandwichEvent,
  type NewTokenMetadata,
  blockQueue,
  config,
  sandwichEvents,
  tokenMetadata,
} from "./schema";

export function generateSolanaAddress(): string {
  return Array.from({ length: 44 }, () => randAlphaNumeric()).join("");
}

export function generateTxHash(): string {
  return Array.from({ length: 88 }, () => randAlphaNumeric()).join("");
}

const configSeedData: NewConfig[] = [
  {
    key: "block_processing_enabled",
    value: "true",
  },
  {
    key: "max_block_queue_size",
    value: "1000",
  },
  {
    key: "sandwich_detection_threshold",
    value: "0.05",
  },
  {
    key: "supported_dexes",
    value: "raydium,orca,jupiter",
  },
];

export function generateBlockQueueData(count: number): NewBlockQueue[] {
  const statuses = ["QUEUED", "PROCESSING", "COMPLETED", "FAILED"] as const;

  return Array.from({ length: count }, (_, i) => ({
    slot: BigInt(200000000 + i),
    status: statuses[Math.floor(Math.random() * statuses.length)] ?? "QUEUED",
  }));
}

export function generateTokenMetadata(count: number): NewTokenMetadata[] {
  const decimalsOptions = [6, 8, 9];
  return Array.from({ length: count }, () => {
    const randomIndex = Math.floor(Math.random() * decimalsOptions.length);
    const decimals =
      typeof decimalsOptions[randomIndex] === "number"
        ? decimalsOptions[randomIndex]
        : 6;
    return {
      token_address: generateSolanaAddress(),
      name: `${randCompanyName()} Token`,
      symbol: Array.from({ length: Math.floor(Math.random() * 4) + 3 }, () =>
        randAlphaNumeric(),
      )
        .join("")
        .toUpperCase(),
      decimals,
      uri: randUrl(),
    };
  });
}

export function generateSandwichEvents(
  count: number,
  tokenAddresses: string[],
  slots: bigint[],
): NewSandwichEvent[] {
  const dexes = ["Raydium", "Orca", "Jupiter", "Serum"];

  return Array.from({ length: count }, () => {
    const slot =
      slots.length > 0
        ? (slots[Math.floor(Math.random() * slots.length)] ?? BigInt(0))
        : BigInt(0);
    const token_address =
      tokenAddresses.length > 0
        ? (tokenAddresses[Math.floor(Math.random() * tokenAddresses.length)] ??
          "")
        : "";
    const attacker_address = generateSolanaAddress();
    const victim_address = generateSolanaAddress();

    return {
      slot,
      sol_amount_drained: BigInt(randNumber({ min: 1000000, max: 100000000 })),
      sol_amount_swap: BigInt(randNumber({ min: 10000000, max: 1000000000 })),
      tx_hash_victim_swap: generateTxHash(),
      tx_hash_attacker_buy: generateTxHash(),
      tx_hash_attacker_sell: generateTxHash(),
      token_address,
      attacker_address,
      victim_address,
      lp_address: generateSolanaAddress(),
      dex_name: dexes[Math.floor(Math.random() * dexes.length)] ?? "Raydium",
      occurred_at: randRecentDate({ days: 30 }),
    };
  });
}

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    console.log("🧹 Clearing existing data...");
    await database.delete(sandwichEvents);
    await database.delete(tokenMetadata);
    await database.delete(blockQueue);
    await database.delete(config);

    console.log("⚙️ Seeding config...");
    await database.insert(config).values(configSeedData);

    console.log("📦 Seeding block queue...");
    const blockQueueData = generateBlockQueueData(100);
    await database.insert(blockQueue).values(blockQueueData);

    console.log("🪙 Seeding token metadata...");
    const tokenMetadataData = generateTokenMetadata(50);
    await database.insert(tokenMetadata).values(tokenMetadataData);

    console.log("🥪 Seeding sandwich events...");
    const tokenAddresses = tokenMetadataData.map((t) => t.token_address);
    const slots = blockQueueData.map((b) => b.slot);
    const sandwichEventData = generateSandwichEvents(
      200,
      tokenAddresses,
      slots,
    );

    const batchSize = 50;
    for (let i = 0; i < sandwichEventData.length; i += batchSize) {
      const batch = sandwichEventData.slice(i, i + batchSize);
      await database.insert(sandwichEvents).values(batch);
      console.log(
        `   Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sandwichEventData.length / batchSize)}`,
      );
    }

    console.log("✅ Seeding completed successfully!");
    console.log(`   - Config entries: ${configSeedData.length}`);
    console.log(`   - Block queue entries: ${blockQueueData.length}`);
    console.log(`   - Token metadata entries: ${tokenMetadataData.length}`);
    console.log(`   - Sandwich events: ${sandwichEventData.length}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
  }
}

if (
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === process.argv[1])
) {
  seed();
}

export { seed };
