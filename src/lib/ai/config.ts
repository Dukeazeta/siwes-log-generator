/**
 * AI SDK Configuration for SwiftLog
 *
 * This module configures the Vercel AI SDK with multiple providers
 * to support flexible AI processing for log generation and OCR tasks.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';

// Provider configurations
export const aiConfig = {
  // OpenAI Configuration
  openai: process.env.OPENAI_API_KEY ? createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }) : null,

  // Anthropic Configuration
  anthropic: process.env.ANTHROPIC_API_KEY ? createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }) : null,

  // Google Configuration
  google: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }) : null,

  // Groq Configuration (already in use)
  groq: process.env.GROQ_API_KEY ? groq() : null,
};

// Default models for each provider
export const modelConfig = {
  openai: {
    chat: 'gpt-4o-mini',
    embedding: 'text-embedding-3-small',
  },
  anthropic: {
    chat: 'claude-3-5-haiku-latest',
  },
  google: {
    chat: 'gemini-2.5-flash',
  },
  groq: {
    chat: 'llama-3.1-8b-instant',
  },
};

// Provider priority for fallback
export const providerPriority = [
  { provider: 'openai', model: modelConfig.openai.chat },
  { provider: 'groq', model: modelConfig.groq.chat },
  { provider: 'google', model: modelConfig.google.chat },
  { provider: 'anthropic', model: modelConfig.anthropic.chat },
];

// Get available providers
export function getAvailableProviders() {
  return providerPriority.filter(config => aiConfig[config.provider] !== null);
}

// Get primary provider
export function getPrimaryProvider() {
  const available = getAvailableProviders();
  return available.length > 0 ? available[0] : null;
}

// Environment-specific settings
export const aiSettings = {
  temperature: Number(process.env.AI_TEMPERATURE) || 0.5,
  maxTokens: Number(process.env.AI_MAX_TOKENS) || 1200,
  topP: Number(process.env.AI_TOP_P) || 0.95,
  topK: Number(process.env.AI_TOP_K) || 20,

  // OCR-specific settings
  ocr: {
    temperature: Number(process.env.OCR_AI_TEMPERATURE) || 0.1,
    maxTokens: Number(process.env.OCR_AI_MAX_TOKENS) || 2048,
  },
};

export default aiConfig;