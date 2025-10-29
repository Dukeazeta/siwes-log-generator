/**
 * Environment variable validation utility
 */

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  groqApiKey?: string;
  geminiApiKey?: string;
}

export function validateEnvironment(): EnvConfig & { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config: Partial<EnvConfig> = {};

  // Supabase configuration (required)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  } else {
    config.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  } else {
    config.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations');
  } else {
    config.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  // AI API keys (at least one required)
  const hasGroqKey = !!process.env.GROQ_API_KEY;
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  if (!hasGroqKey && !hasGeminiKey) {
    errors.push('At least one AI API key is required: GROQ_API_KEY or GEMINI_API_KEY');
  }

  if (hasGroqKey) {
    config.groqApiKey = process.env.GROQ_API_KEY;
  }

  if (hasGeminiKey) {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  }

  return {
    valid: errors.length === 0,
    errors,
    supabaseUrl: config.supabaseUrl || '',
    supabaseAnonKey: config.supabaseAnonKey || '',
    supabaseServiceKey: config.supabaseServiceKey || '',
    groqApiKey: config.groqApiKey,
    geminiApiKey: config.geminiApiKey,
  };
}

export function checkAiConfiguration(): { enabled: string[]; disabled: string[] } {
  const enabled: string[] = [];
  const disabled: string[] = [];

  if (process.env.GROQ_API_KEY) {
    enabled.push('Groq (Llama)');
  } else {
    disabled.push('Groq (Llama)');
  }

  if (process.env.GEMINI_API_KEY) {
    enabled.push('Gemini');
  } else {
    disabled.push('Gemini');
  }

  return { enabled, disabled };
}

export function getEnvironmentInfo() {
  const env = validateEnvironment();
  const aiConfig = checkAiConfiguration();

  return {
    environment: process.env.NODE_ENV,
    supabaseConfigured: env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceKey,
    aiProviders: aiConfig,
    errors: env.errors,
  };
}