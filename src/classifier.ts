/**
 * LLM-based classifier using Groq (Llama-3).
 *
 * Processes raw places scraped from Google Maps and determines whether
 * each one is a private clinic (Iyada) or should be discarded
 * (hospital, medical center, lab, pharmacy).
 */

import Groq from "groq-sdk";
import pLimit from "p-limit";
import { withRetry } from "./retry.js";
import { logger } from "./logger.js";
import type { RawPlace, ClassificationResult } from "./types.js";

const CLASSIFICATION_PROMPT = `You are an expert at classifying Egyptian healthcare facilities. Your task is to determine if a given place is a **private clinic (Iyada/عيادة)** or not.

You must REJECT the following types (they are NOT private clinics):
- Hospitals (Mustashfa/مستشفى) — large multi-department medical institutions
- Medical Centers (Markaz/مركز) — corporate healthcare centers with multiple departments
- Laboratories (Ma3mal/معمل/مختبر) — diagnostic labs
- Pharmacies (Saydaliya/صيدلية) — drug stores
- Imaging/Radiology Centers (Markaz Asha3a/مركز أشعة)

You must ACCEPT these types (they ARE private clinics):
- Solo doctor practices (عيادة دكتور) — "Dr. Ahmed Clinic", "Dr. Sara Eye Clinic"
- Small group practices — a few doctors sharing a clinic space
- Specialized private clinics — "Iyada" or "عيادة" in the name

IMPORTANT DISAMBIGUATION RULES:
- "Dr. [Name] Center" or "مركز دكتور [Name]" → This is usually a PRIVATE CLINIC disguised as a center. A single doctor running their own center. Mark as ACCEPT with Medium confidence.
- "[Generic Name] Center" (e.g., "The Cairo Center", "Nile Medical Center") → This is usually a CORPORATE medical center. Mark as REJECT.
- If the name contains a doctor's personal name AND a specialization, it is very likely a private clinic.
- If the name only contains a geographic or generic corporate name, it is likely NOT a private clinic.

Respond ONLY with a valid JSON object, no other text:
{
  "isPrivateClinic": boolean,
  "confidence": "High" | "Medium" | "Low",
  "doctorName": "extracted doctor name or empty string",
  "reasoning": "brief explanation of why"
}`;

/**
 * Classifies a single place using Groq Llama-3.
 */
async function classifySinglePlace(
  client: Groq,
  place: RawPlace,
): Promise<ClassificationResult> {
  const userPrompt = `Classify this Egyptian place:\nName: "${place.name}"\nAddress: "${place.address || "N/A"}"\n\nIs this a private clinic (Iyada)?`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: CLASSIFICATION_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const text = response.choices[0]?.message?.content || "{}";
  return JSON.parse(text) as ClassificationResult;
}

/**
 * Classifies an array of raw places, returning only private clinics
 * along with their classification results.
 *
 * @param places - Array of raw places from the scraper
 * @param apiKey - Groq API key
 * @param concurrency - Max parallel requests (default: 2)
 * @returns Accepted clinics with their classification data
 */
export async function classifyPlaces(
  places: RawPlace[],
  apiKey: string,
  concurrency: number = 2,
): Promise<Array<{ place: RawPlace; classification: ClassificationResult }>> {
  logger.info(
    `Classifying ${places.length} places with Groq Llama-3 (concurrency=${concurrency})`,
  );

  const client = new Groq({ apiKey });
  const limit = pLimit(concurrency);

  const results = await Promise.allSettled(
    places.map((place) =>
      limit(async () => {
        // Small delay between requests to avoid bursting rate limits
        await new Promise((r) => setTimeout(r, 1500));

        const classification = await withRetry(
          () => classifySinglePlace(client, place),
          `Classify: ${place.name}`,
          { maxAttempts: 5, baseDelayMs: 3000 },
        );

        if (classification.isPrivateClinic) {
          logger.info(
            `✅ ACCEPTED: "${place.name}" (${classification.confidence}) — ${classification.reasoning}`,
          );
        } else {
          logger.info(
            `❌ REJECTED: "${place.name}" — ${classification.reasoning}`,
          );
        }

        return { place, classification };
      }),
    ),
  );

  const accepted: Array<{
    place: RawPlace;
    classification: ClassificationResult;
  }> = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.classification.isPrivateClinic) {
        accepted.push(result.value);
      }
    } else {
      logger.error("Classification failed for a place", result.reason);
    }
  }

  logger.info(
    `Classification complete: ${accepted.length}/${places.length} accepted as private clinics`,
  );

  return accepted;
}
