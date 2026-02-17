/**
 * Google Maps scraper using SerpApi.
 *
 * Queries SerpApi's google_maps engine for places matching a search query,
 * extracts structured data, and returns an array of RawPlace objects.
 */

import { getJson } from "serpapi";
import { withRetry } from "./retry.js";
import { logger } from "./logger.js";
import type { RawPlace } from "./types.js";

const SERPAPI_TIMEOUT_MS = 30000;

interface SerpApiLocalResult {
  title?: string;
  address?: string;
  phone?: string;
  place_id?: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
  data_id?: string;
}

interface SerpApiResponse {
  local_results?: SerpApiLocalResult[];
  error?: string;
}

/**
 * Builds a Google Maps link from a place_id or coordinates.
 */
function buildMapsLink(result: SerpApiLocalResult): string {
  if (result.data_id) {
    return `https://www.google.com/maps/place/?q=place_id:${result.data_id}`;
  }
  if (result.place_id) {
    return `https://www.google.com/maps/place/?q=place_id:${result.place_id}`;
  }
  if (result.gps_coordinates) {
    const { latitude, longitude } = result.gps_coordinates;
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  return "";
}

/**
 * Scrapes Google Maps for places matching the given query.
 *
 * @param query - Search query (e.g. "Dermatologist in Maadi")
 * @param apiKey - SerpApi API key
 * @returns Array of raw place data
 */
export async function scrapeGoogleMaps(
  query: string,
  apiKey: string,
): Promise<RawPlace[]> {
  logger.info(`Starting Google Maps scrape for: "${query}"`);

  const response = await withRetry<SerpApiResponse>(
    async () => {
      const result = await getJson({
        engine: "google_maps",
        q: query,
        hl: "en",
        gl: "eg",
        type: "search",
        api_key: apiKey,
        timeout: SERPAPI_TIMEOUT_MS,
      });
      return result as SerpApiResponse;
    },
    "SerpApi Google Maps",
    { maxAttempts: 3, baseDelayMs: 2000 },
  );

  if (response.error) {
    throw new Error(`SerpApi returned error: ${response.error}`);
  }

  const localResults = response.local_results || [];

  if (localResults.length === 0) {
    logger.warn(`No results found for query: "${query}"`);
    return [];
  }

  logger.info(`Found ${localResults.length} raw results from Google Maps`);

  const places: RawPlace[] = localResults.map((result) => {
    const place: RawPlace = {
      name: result.title || "Unknown",
      address: result.address,
      phone: result.phone,
      mapsLink: buildMapsLink(result),
    };

    if (!place.phone) {
      logger.warn(`No phone number found for: ${place.name}`);
    }

    return place;
  });

  return places;
}
