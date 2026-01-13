/**
 * Utility functions for handling country flags
 */

/**
 * Converts an ISO 3166-1 alpha-2 country code to a flag emoji.
 * Example: "US" -> "🇺🇸"
 */
export function getCountryFlag(countryCode: string | undefined): string {
  if (!countryCode) return "";
  
  // ASCII offset for regional indicator symbols is 127397
  // 'A' (65) + 127397 = 127462 (Regional Indicator Symbol Letter A)
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
    
  return String.fromCodePoint(...codePoints);
}

/**
 * Common country codes used in brewing
 */
export const BREWING_ORIGINS: Record<string, string> = {
  US: "United States",
  DE: "Germany",
  GB: "United Kingdom",
  BE: "Belgium",
  NZ: "New Zealand",
  AU: "Australia",
  CZ: "Czech Republic",
  PL: "Poland",
  CA: "Canada",
  FR: "France",
  FI: "Finland", // Viking Malt
  NO: "Norway",
};
