import { randomBytes } from 'crypto';

export function generateApiKey(): string {
  // Generate a secure random API key with prefix
  return `api_${randomBytes(32).toString('hex')}`;
}

export function validateApiKeyFormat(apiKey: string): boolean {
  // Check if the API key has the correct format
  return /^api_[a-f0-9]{64}$/.test(apiKey);
}