/**
 * Output module — writes classified leads to CSV and JSON files.
 */

import { createObjectCsvWriter } from "csv-writer";
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { logger } from "./logger.js";
import type { ClassifiedLead } from "./types.js";

const DEFAULT_OUTPUT_DIR = "output";

/**
 * Ensures the output directory exists.
 */
async function ensureOutputDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

/**
 * Writes classified leads to both CSV and JSON files.
 *
 * @param leads - Array of classified leads
 * @param outputDir - Output directory (default: "output")
 */
export async function writeLeads(
  leads: ClassifiedLead[],
  outputDir: string = DEFAULT_OUTPUT_DIR,
): Promise<{ csvPath: string; jsonPath: string }> {
  await ensureOutputDir(outputDir);

  const csvPath = join(outputDir, "leads.csv");
  const jsonPath = join(outputDir, "leads.json");

  // Write CSV
  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: "clinic_name", title: "clinic_name" },
      { id: "doctor_name", title: "doctor_name" },
      { id: "phone_number", title: "phone_number" },
      { id: "address", title: "address" },
      { id: "Maps_link", title: "Maps_link" },
      { id: "confidence_score", title: "confidence_score" },
    ],
  });

  await csvWriter.writeRecords(leads);
  logger.info(`📄 CSV written: ${csvPath} (${leads.length} leads)`);

  // Write JSON
  await writeFile(jsonPath, JSON.stringify(leads, null, 2), "utf-8");
  logger.info(`📄 JSON written: ${jsonPath} (${leads.length} leads)`);

  return { csvPath, jsonPath };
}
