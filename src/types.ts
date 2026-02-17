/**
 * Shared TypeScript interfaces for the clinic scraper pipeline.
 */

/** Raw place data returned from Google Maps scraping */
export interface RawPlace {
  name: string;
  address?: string;
  phone?: string;
  mapsLink?: string;
}

/** Final classified lead ready for CSV output */
export interface ClassifiedLead {
  clinic_name: string;
  doctor_name: string;
  phone_number: string;
  address: string;
  Maps_link: string;
  confidence_score: "High" | "Medium" | "Low";
}

/** LLM classification result for a single place */
export interface ClassificationResult {
  isPrivateClinic: boolean;
  confidence: "High" | "Medium" | "Low";
  doctorName: string;
  reasoning: string;
}
