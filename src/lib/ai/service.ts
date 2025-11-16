/**
 * Unified AI Service using Vercel AI SDK
 *
 * This service provides a unified interface for AI operations
 * including text generation, OCR processing, and structured output.
 */

import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { aiConfig, getAvailableProviders, aiSettings } from './config';

// Error class for AI service
export class AIServiceError extends Error {
  constructor(
    message: string,
    public provider?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// AI Provider interface
interface AIProvider {
  provider: string;
  model: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance: any;
}

// Get model instance for a provider
function getModelInstance(providerName: string, modelName: string) {
  const provider = aiConfig[providerName];
  if (!provider) {
    throw new AIServiceError(`Provider ${providerName} not configured`, providerName);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance = provider as any;

  switch (providerName) {
    case 'openai':
      return instance(modelName);
    case 'anthropic':
      return instance(modelName);
    case 'google':
      return instance(modelName);
    case 'groq':
      return instance(modelName);
    default:
      throw new AIServiceError(`Unknown provider: ${providerName}`, providerName);
  }
}

// AI Service class
export class AIService {
  private providers: AIProvider[];

  constructor() {
    this.providers = getAvailableProviders().map(config => ({
      provider: config.provider,
      model: config.model,
      instance: aiConfig[config.provider]!,
    }));
  }

  /**
   * Generate text with fallback support
   */
  async generateText(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
      preferredProvider?: string;
    } = {}
  ): Promise<{ text: string; provider: string; model: string }> {
    const { temperature = aiSettings.temperature, maxTokens = aiSettings.maxTokens, system, preferredProvider } = options;

    let lastError: Error | null = null;

    // Try preferred provider first if specified
    const providersToTry = preferredProvider
      ? [preferredProvider, ...this.providers.map(p => p.provider).filter(p => p !== preferredProvider)]
      : this.providers.map(p => p.provider);

    for (const providerName of providersToTry) {
      try {
        const model = getModelInstance(providerName, this.getModelForProvider(providerName));

        const result = await generateText({
          model,
          prompt,
          system,
          temperature,
          maxTokens,
        });

        console.log(`✅ Generated text using ${providerName}`);
        return {
          text: result.text,
          provider: providerName,
          model: this.getModelForProvider(providerName),
        };
      } catch (error) {
        console.warn(`❌ Failed to generate text with ${providerName}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    throw new AIServiceError(
      'All AI providers failed',
      providersToTry[0],
      lastError || new Error('Unknown error')
    );
  }

  /**
   * Generate structured object with Zod schema
   */
  async generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
      preferredProvider?: string;
    } = {}
  ): Promise<{ object: T; provider: string; model: string }> {
    const { temperature = aiSettings.temperature, maxTokens = aiSettings.maxTokens, system, preferredProvider } = options;

    let lastError: Error | null = null;

    const providersToTry = preferredProvider
      ? [preferredProvider, ...this.providers.map(p => p.provider).filter(p => p !== preferredProvider)]
      : this.providers.map(p => p.provider);

    for (const providerName of providersToTry) {
      try {
        const model = getModelInstance(providerName, this.getModelForProvider(providerName));

        const result = await generateObject({
          model,
          prompt,
          system,
          temperature,
          maxTokens,
          schema,
        });

        console.log(`✅ Generated object using ${providerName}`);
        return {
          object: result.object,
          provider: providerName,
          model: this.getModelForProvider(providerName),
        };
      } catch (error) {
        console.warn(`❌ Failed to generate object with ${providerName}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    throw new AIServiceError(
      'All AI providers failed for object generation',
      providersToTry[0],
      lastError || new Error('Unknown error')
    );
  }

  /**
   * Generate logbook entry (structured output)
   */
  async generateLogbookEntry(params: {
    weekNumber: number;
    startDate: string;
    endDate: string;
    activities: string;
    userProfile?: {
      full_name?: string;
      course?: string;
      institution?: string;
      company_name?: string;
      department?: string;
      industry_type?: string;
    };
  }) {
    const { weekNumber, startDate, endDate, activities, userProfile } = params;

    const logbookSchema = z.object({
      weekSummary: z.string().describe('1-2 concise sentences about the week'),
      dailyActivities: z.array(
        z.object({
          day: z.string(),
          date: z.string(),
          activities: z.string(),
        })
      ).describe('5 working days with personalized activities starting with "I"'),
      skillsDeveloped: z.array(z.string()).describe('3-4 key technical and soft skills'),
      challengesFaced: z.string().describe('1-2 sentences about challenges and solutions'),
      learningOutcomes: z.string().describe('2-3 sentences about key learnings'),
    });

    const systemPrompt = `You are ${userProfile?.full_name || 'a SIWES student'}, creating a personal logbook entry. Write in first person and make it authentic and personalized.

Student Profile:
- I am studying ${userProfile?.course || 'my course'}
- I'm doing my SIWES at ${userProfile?.company_name || 'my company'} in the ${userProfile?.department || 'department'}
- Week ${weekNumber} (${startDate} to ${endDate})
- This week I focused on: ${activities}

CRITICAL LOG REQUIREMENTS:
1. **Start EVERY daily activity with "I"** - this is mandatory
2. **Be concise and direct** - no unnecessary fluff or formal language
3. **Make it personal and authentic** - use natural, conversational tone
4. **Focus on what I actually did** - specific, real activities
5. **Keep it short and impactful** - 1-2 sentences per activity maximum

Daily Activity Format Examples:
❌ Wrong: "On Monday, I was assigned the responsibility of assisting the senior engineers with..."
✅ Right: "I helped the senior engineers configure the network switches and documented the setup."

❌ Wrong: "During the course of Tuesday, I participated in the implementation of..."
✅ Right: "I implemented the user authentication module and tested it with different user roles."

❌ Wrong: "Wednesday involved me attending meetings where I..."
✅ Right: "I attended the client meeting and took notes for the project requirements."

Content Style:
- Write like a real student talking about their week
- Use first-person throughout ("I learned", "I discovered", "I struggled with")
- Be specific but brief
- Include real challenges and how you overcame them
- Focus on actual skills gained, not generic statements
- Keep the tone professional but personal, not corporate or academic

Make this sound like a real student's experience - authentic, concise, and meaningful!`;

    return this.generateObject(
      `Create a personal, first-person SIWES logbook entry for ${userProfile?.full_name || 'a student'} studying ${userProfile?.course || 'their course'} at ${userProfile?.company_name || 'their company'}. Make it authentic, concise, and ensure every daily activity starts with "I". Focus on real, specific actions taken during week ${weekNumber} (${startDate} to ${endDate}) covering: ${activities}`,
      logbookSchema,
      {
        system: systemPrompt,
        temperature: 0.3, // Lower temperature for more consistent personal tone
        maxTokens: 800, // Reduced tokens for shorter, more concise responses
      }
    );
  }

  /**
   * Process OCR text with AI enhancement
   */
  async processOCRText(ocrText: string, _weekNumber?: string) {
    const ocrSchema = z.object({
      monday: z.string().optional(),
      tuesday: z.string().optional(),
      wednesday: z.string().optional(),
      thursday: z.string().optional(),
      friday: z.string().optional(),
    });

    const systemPrompt = `You are an OCR error correction specialist. Your job is to fix OCR scanning errors while PRESERVING the original student's words as much as possible.

CRITICAL: DO NOT rewrite or rephrase the student's original text. Only fix obvious OCR errors and fill in missing words.

STEP 1 - FIX OCR ERRORS ONLY:
Fix these types of errors while keeping the original wording:
- Misspelled words due to OCR scanning artifacts
- Missing letters: "netwok" → "network", "equipmnt" → "equipment", "measurment" → "measurement"
- Extra/wrong letters: "maintance" → "maintenance", "analize" → "analyze", "experment" → "experiment"
- Word breaks: "work shop" → "workshop", "data base" → "database", "class room" → "classroom"
- Garbled technical/professional terms: Use context to identify the correct word for the field

STEP 2 - FILL IN MISSING WORDS (CONTEXT-AWARE):
When you find incomplete sentences with missing words (gaps indicated by unclear text):
- Use context from surrounding words to determine what word is missing
- Consider the student's field of study based on the terminology used
- Insert ONLY the missing word(s) needed to complete the sentence

STEP 3 - WHAT NOT TO CHANGE:
- Keep the student's original sentence structure
- Keep their original word choices (unless they're OCR errors)
- Keep their writing style and voice
- Don't make it more formal or professional if they wrote casually
- Don't add new activities that weren't mentioned
- Don't combine or split sentences unnecessarily

STEP 4 - REMOVE METADATA:
Remove these items (they are not student activities):
- ALL dates (30/06/2025, 04/071/2023, etc.)
- Headers: "WEEKLY PROGRESS CHART", "WEEK ENDING", "Description of Work Done"
- Page numbers, signatures, emails, "NO WORK"
- Saturday and Sunday (only keep Monday-Friday)

STEP 5 - EXTRACT MONDAY-FRIDAY ACTIVITIES:
- Find day markers: Monday, Tuesday, Wednesday, Thursday, Friday
- Extract the text after each day marker
- Keep the original text but fix OCR errors`;

    return this.generateObject(
      `Process this OCR text and extract Monday-Friday activities, fixing only OCR errors and removing metadata: ${ocrText}`,
      ocrSchema,
      {
        system: systemPrompt,
        temperature: aiSettings.ocr.temperature,
        maxTokens: aiSettings.ocr.maxTokens,
      }
    );
  }

  /**
   * Get model for provider
   */
  private getModelForProvider(provider: string): string {
    switch (provider) {
      case 'openai': return 'gpt-4o-mini';
      case 'anthropic': return 'claude-3-5-haiku-latest';
      case 'google': return 'gemini-1.5-flash';
      case 'groq': return 'llama-3.1-8b-instant';
      default: throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return this.providers.map(p => p.provider);
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.providers.length > 0;
  }
}

// Singleton instance
export const aiService = new AIService();

// Export convenience functions
export const generateAIResponse = (prompt: string, options?: Parameters<AIService['generateText']>[1]) =>
  aiService.generateText(prompt, options);

export const generateStructuredResponse = <T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  options?: Parameters<AIService['generateObject']>[2]
) => aiService.generateObject(prompt, schema, options);

export default aiService;