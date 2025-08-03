import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

/**
 * Generate a secure API key
 * Format: sk-{32_char_random_string}
 * 
 * @returns A secure API key string
 */
export const generateApiKey = (): string => {
  // Generate a random 32-character string using crypto
  const randomBytes = crypto.randomBytes(24); // 24 bytes = 32 base64 characters (without padding)
  const randomString = randomBytes.toString("base64")
    .replace(/\+/g, "0")  // Replace + with 0
    .replace(/\//g, "1")  // Replace / with 1
    .replace(/=/g, "")    // Remove padding
    .substring(0, 32);    // Ensure exactly 32 characters

  return `sk-${randomString}`;
};

/**
 * Validate API key format
 * 
 * @param apiKey The API key to validate
 * @returns True if the API key has valid format
 */
export const isValidApiKeyFormat = (apiKey?: string): boolean => {
  if (!apiKey) return false;
  
  // Check if it starts with 'sk-' and has at least 32 total characters
  return apiKey.startsWith("sk-") && apiKey.length >= 35; // sk- (3) + 32 chars = 35 minimum
};