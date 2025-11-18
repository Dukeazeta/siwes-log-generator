/**
 * AI SDK Configuration for SwiftLog
 *
 * This module configures the Vercel AI SDK with Google Gemini
 * for AI processing including log generation and OCR tasks.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Google Gemini Configuration
export const aiConfig = {
  google: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }) : null,
};

// Default model configuration
export const modelConfig = {
  google: {
    chat: 'gemini-2.5-flash',
  },
};

// Get available provider (just Google)
export function getAvailableProviders() {
  return aiConfig.google ? [{ provider: 'google', model: modelConfig.google.chat }] : [];
}

// Get primary provider (just Google)
export function getPrimaryProvider() {
  return aiConfig.google ? { provider: 'google', model: modelConfig.google.chat } : null;
}

// Environment-specific settings
export const aiSettings = {
  temperature: Number(process.env.AI_TEMPERATURE) || 0.5,
  topP: Number(process.env.AI_TOP_P) || 0.95,
  topK: Number(process.env.AI_TOP_K) || 20,

  // OCR-specific settings
  ocr: {
    temperature: Number(process.env.OCR_AI_TEMPERATURE) || 0.1,
  },
};

export default aiConfig;