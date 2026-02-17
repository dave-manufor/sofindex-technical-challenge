/**
 * CLI entry point and orchestration for the Clinic Scraper microservice.
 *
 * Flow:
 *   CLI args → Scrape Google Maps → Classify with LLM → Format phones → Write output
 */

import "dotenv/config";
import { Command } from "commander";
import { scrapeGoogleMaps } from "./scraper.js";
import { classifyPlaces } from "./classifier.js";
import { formatEgyptianPhone } from "./phone.js";
import { writeLeads } from "./output.js";
import { logger } from "./logger.js";
import type { ClassifiedLead } from "./types.js";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    logger.error(`Missing required environment variable: ${key}`);
    logger.error(`Copy .env.example to .env and fill in your API keys.`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("clinic-scraper")
    .description(
      "Scrapes Google Maps for private clinics in Egypt, filters with AI, and outputs clean lead data.",
    )
    .version("1.0.0")
    .requiredOption(
      "-q, --query <query>",
      'Search query (e.g., "Dermatologist in Maadi")',
    )
    .option("-o, --output <dir>", "Output directory for leads files", "output")
    .option(
      "-c, --concurrency <number>",
      "Max parallel LLM requests",
      String(process.env.MAX_CONCURRENCY || "2"),
    )
    .parse();

  const opts = program.opts<{
    query: string;
    output: string;
    concurrency: string;
  }>();

  const query = opts.query;
  const outputDir = opts.output;
  const concurrency = parseInt(opts.concurrency, 10);

  // Validate environment
  const serpApiKey = getRequiredEnv("SERPAPI_API_KEY");
  const groqApiKey = getRequiredEnv("GROQ_API_KEY");

  logger.info("=".repeat(60));
  logger.info("🏥 Clinic Scraper Microservice");
  logger.info("=".repeat(60));
  logger.info(`Query: "${query}"`);
  logger.info(`LLM: Groq Llama-3`);
  logger.info(`Output: ${outputDir}/`);
  logger.info(`Concurrency: ${concurrency}`);
  logger.info("=".repeat(60));

  // Step 1: Scrape Google Maps
  logger.info("\n📍 Step 1/3: Scraping Google Maps...");
  const rawPlaces = await scrapeGoogleMaps(query, serpApiKey);

  if (rawPlaces.length === 0) {
    logger.warn("No results found. Exiting.");
    process.exit(0);
  }

  // Step 2: Classify with LLM
  logger.info("\n🤖 Step 2/3: Classifying with Groq Llama-3...");
  const classifiedResults = await classifyPlaces(
    rawPlaces,
    groqApiKey,
    concurrency,
  );

  if (classifiedResults.length === 0) {
    logger.warn("No private clinics found after classification. Exiting.");
    process.exit(0);
  }

  // Step 3: Format and write output
  logger.info("\n📝 Step 3/3: Formatting and writing output...");
  const leads: ClassifiedLead[] = classifiedResults.map(
    ({ place, classification }) => ({
      clinic_name: place.name,
      doctor_name: classification.doctorName || "",
      phone_number: formatEgyptianPhone(place.phone) || place.phone || "",
      address: place.address || "",
      Maps_link: place.mapsLink || "",
      confidence_score: classification.confidence,
    }),
  );

  const { csvPath, jsonPath } = await writeLeads(leads, outputDir);

  // Summary
  logger.info("\n" + "=".repeat(60));
  logger.info("✅ Scraping complete!");
  logger.info(`   Total scraped:     ${rawPlaces.length}`);
  logger.info(`   Private clinics:   ${leads.length}`);
  logger.info(`   Filtered out:      ${rawPlaces.length - leads.length}`);
  logger.info(`   CSV output:        ${csvPath}`);
  logger.info(`   JSON output:       ${jsonPath}`);
  logger.info("=".repeat(60));
}

main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
