import { database } from "./database";
import { generateMockBlockQueueData } from "./mocks/helpers/generateMockBlockQueueData";
import { generateMockConfig } from "./mocks/helpers/generateMockConfig";
import { generateMockSandwichEvents } from "./mocks/helpers/generateMockSandwichEvents";
import { generateMockTokenMetadata } from "./mocks/helpers/generateMockTokenMetadata";
import { generateMockTokens } from "./mocks/helpers/generateMockTokens";
import { blockQueue } from "./schemas/blockQueue";
import { config } from "./schemas/config";
import { sandwichEvents } from "./schemas/sandwichEvents";
import { tokenMetadata } from "./schemas/tokenMetadata";
import { tokens } from "./schemas/tokens";

async function seed() {
  console.log("🌱 Starting database seeding...");

  const mockConfigData = generateMockConfig();
  const mockTokensData = generateMockTokens(50);
  const mockBlockQueueData = generateMockBlockQueueData(100);
  const mockTokenMetadataData = generateMockTokenMetadata(50);
  const mockSandwichEventsData = generateMockSandwichEvents(
    200,
    mockTokenMetadataData.map((t) => t.token_address),
    mockBlockQueueData.map((b) => b.slot),
  );

  try {
    console.log("🧹 Clearing existing data...");
    await database.delete(sandwichEvents);
    await database.delete(tokenMetadata);
    await database.delete(blockQueue);
    await database.delete(config);

    console.log("⚙️ Seeding config...");
    await database.insert(config).values(mockConfigData);

    console.log("🪙 Seeding tokens...");
    await database.insert(tokens).values(mockTokensData);

    console.log("📦 Seeding block queue...");
    await database.insert(blockQueue).values(mockBlockQueueData);

    console.log("🪙 Seeding token metadata...");
    await database.insert(tokenMetadata).values(mockTokenMetadataData);

    console.log("🥪 Seeding sandwich events...");
    const batchSize = 50;
    for (let i = 0; i < mockSandwichEventsData.length; i += batchSize) {
      const batch = mockSandwichEventsData.slice(i, i + batchSize);
      await database.insert(sandwichEvents).values(batch);
    }

    console.log("✅ Seeding completed successfully!");
    console.log(`   - Config entries: ${mockConfigData.length}`);
    console.log(`   - Block queue entries: ${mockBlockQueueData.length}`);
    console.log(`   - Token metadata entries: ${mockTokenMetadataData.length}`);
    console.log(`   - Sandwich events: ${mockSandwichEventsData.length}`);
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
