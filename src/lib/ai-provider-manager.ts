import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export type AIProvider = "gemini" | "groq" | "auto";

export interface ProviderHealth {
  status: "healthy" | "degraded" | "unhealthy";
  lastChecked: Date;
  errorCount: number;
  responseTime?: number;
}

export interface UsageStats {
  requestsToday: number;
  tokensToday: number;
  lastReset: Date;
}

export interface LogContent {
  weekSummary: string;
  dailyActivities: Array<{
    day: string;
    date: string;
    activities: string;
  }>;
  skillsDeveloped: string[];
  challengesFaced: string;
  learningOutcomes: string;
}

export interface GenerationRequest {
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
}

class AIProviderManager {
  private geminiClient: GoogleGenerativeAI;
  private groqClient: Groq;
  private preferredProvider: AIProvider = "gemini";

  // Rate limiting and quota tracking
  private geminiUsage: UsageStats = {
    requestsToday: 0,
    tokensToday: 0,
    lastReset: new Date(),
  };

  private groqUsage: UsageStats = {
    requestsToday: 0,
    tokensToday: 0,
    lastReset: new Date(),
  };

  // Health monitoring
  private geminiHealth: ProviderHealth = {
    status: "healthy",
    lastChecked: new Date(),
    errorCount: 0,
  };

  private groqHealth: ProviderHealth = {
    status: "healthy",
    lastChecked: new Date(),
    errorCount: 0,
  };

  // Rate limits (Gemini free tier)
  private readonly GEMINI_MAX_REQUESTS_PER_MINUTE = 15;
  private readonly GEMINI_MAX_TOKENS_PER_DAY = 1000000;
  private readonly GROQ_MAX_REQUESTS_PER_MINUTE = 30;
  private readonly RETRY_DELAY = 2000; // 2 seconds retry delay

  private requestHistory: { provider: string; timestamp: Date; tokens: number }[] = [];

  constructor() {
    this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    this.groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY || "",
    });

    // Reset usage stats daily
    this.resetUsageIfNeeded();
  }

  public setProvider(provider: AIProvider): void {
    this.preferredProvider = provider;
  }

  public getProvider(): AIProvider {
    return this.preferredProvider;
  }

  public getProviderHealth(): { gemini: ProviderHealth; groq: ProviderHealth } {
    return {
      gemini: { ...this.geminiHealth },
      groq: { ...this.groqHealth },
    };
  }

  public getUsageStats(): { gemini: UsageStats; groq: UsageStats } {
    return {
      gemini: { ...this.geminiUsage },
      groq: { ...this.groqUsage },
    };
  }

  private resetUsageIfNeeded(): void {
    const now = new Date();
    const lastReset = this.geminiUsage.lastReset;

    // Reset daily counters if it's a new day
    if (
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      this.geminiUsage = {
        requestsToday: 0,
        tokensToday: 0,
        lastReset: now,
      };

      this.groqUsage = {
        requestsToday: 0,
        tokensToday: 0,
        lastReset: now,
      };

      // Clear old request history
      this.requestHistory = [];
    }
  }

  private canUseGemini(): boolean {
    this.resetUsageIfNeeded();

    // Check daily token limit
    if (this.geminiUsage.tokensToday >= this.GEMINI_MAX_TOKENS_PER_DAY) {
      console.log("Gemini daily token limit exceeded");
      return false;
    }

    // Check requests per minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentGeminiRequests = this.requestHistory.filter(
      (req) => req.provider === "gemini" && req.timestamp > oneMinuteAgo,
    ).length;

    if (recentGeminiRequests >= this.GEMINI_MAX_REQUESTS_PER_MINUTE) {
      console.log("Gemini rate limit exceeded");
      return false;
    }

    // Check health status
    if (this.geminiHealth.status === "unhealthy") {
      console.log("Gemini is unhealthy");
      return false;
    }

    return true;
  }

  private canUseGroq(): boolean {
    // Check requests per minute for Groq
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentGroqRequests = this.requestHistory.filter(
      (req) => req.provider === "groq" && req.timestamp > oneMinuteAgo,
    ).length;

    if (recentGroqRequests >= this.GROQ_MAX_REQUESTS_PER_MINUTE) {
      console.log("Groq rate limit exceeded");
      return false;
    }

    // Check health status
    if (this.groqHealth.status === "unhealthy") {
      console.log("Groq is unhealthy");
      return false;
    }

    return true;
  }

  private selectProvider(): "gemini" | "groq" {
    if (this.preferredProvider === "gemini" && this.canUseGemini()) {
      return "gemini";
    }

    if (this.preferredProvider === "groq" && this.canUseGroq()) {
      return "groq";
    }

    // Auto mode or fallback logic
    if (this.canUseGemini()) {
      return "gemini";
    }

    if (this.canUseGroq()) {
      return "groq";
    }

    // If both are unavailable, try Gemini anyway (will handle the error)
    return "gemini";
  }

  private updateHealth(provider: "gemini" | "groq", success: boolean, responseTime?: number): void {
    const health = provider === "gemini" ? this.geminiHealth : this.groqHealth;

    health.lastChecked = new Date();
    health.responseTime = responseTime;

    if (success) {
      health.errorCount = Math.max(0, health.errorCount - 1);
      if (health.errorCount === 0) {
        health.status = "healthy";
      } else if (health.errorCount < 3) {
        health.status = "degraded";
      }
    } else {
      health.errorCount += 1;
      if (health.errorCount >= 5) {
        health.status = "unhealthy";
      } else if (health.errorCount >= 3) {
        health.status = "degraded";
      }
    }
  }

  private trackUsage(provider: "gemini" | "groq", tokens: number): void {
    const usage = provider === "gemini" ? this.geminiUsage : this.groqUsage;

    usage.requestsToday += 1;
    usage.tokensToday += tokens;

    // Add to request history for rate limiting
    this.requestHistory.push({
      provider,
      timestamp: new Date(),
      tokens,
    });

    // Clean old entries (keep only last hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    this.requestHistory = this.requestHistory.filter((req) => req.timestamp > oneHourAgo);
  }

  public async generateLog(request: GenerationRequest): Promise<LogContent> {
    const selectedProvider = this.selectProvider();
    console.log(`Using AI provider: ${selectedProvider}`);

    const startTime = Date.now();

    try {
      let result: LogContent;

      if (selectedProvider === "gemini") {
        result = await this.generateWithGemini(request);
      } else {
        result = await this.generateWithGroq(request);
      }

      const responseTime = Date.now() - startTime;
      this.updateHealth(selectedProvider, true, responseTime);

      // Estimate tokens (rough approximation)
      const estimatedTokens = JSON.stringify(result).length / 4;
      this.trackUsage(selectedProvider, Math.round(estimatedTokens));

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateHealth(selectedProvider, false, responseTime);

      console.error(`Error with ${selectedProvider}:`, error);

      // Try fallback if primary provider failed
      if (selectedProvider === "gemini" && this.canUseGroq()) {
        console.log("Falling back to Groq...");
        try {
          const result = await this.generateWithGroq(request);
          this.updateHealth("groq", true);

          const estimatedTokens = JSON.stringify(result).length / 4;
          this.trackUsage("groq", Math.round(estimatedTokens));

          return result;
        } catch (fallbackError) {
          this.updateHealth("groq", false);
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  private async generateWithGemini(request: GenerationRequest): Promise<LogContent> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    const { weekNumber, startDate, endDate, activities, userProfile } = request;

    const model = this.geminiClient.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `You are an AI assistant helping a SIWES (Students Industrial Work Experience Scheme) student create a professional logbook entry.

Student Information:
- Name: ${userProfile?.full_name || "Student"}
- Course: ${userProfile?.course || "Not specified"}
- Institution: ${userProfile?.institution || "Not specified"}
- Company: ${userProfile?.company_name || "Not specified"}
- Department: ${userProfile?.department || "Not specified"}
- Industry: ${userProfile?.industry_type || "Not specified"}

Week Details:
- Week Number: ${weekNumber}
- Date Range: ${startDate} to ${endDate}
- Activities Summary: ${activities}

Please generate a professional SIWES logbook entry with the following structure:

1. **Week Summary** (2-3 sentences describing the overall focus of the week)
2. **Daily Breakdown** (5 working days with specific activities for each day)
3. **Skills Developed** (List of technical and soft skills gained)
4. **Challenges Faced** (Any difficulties encountered and how they were addressed)
5. **Learning Outcomes** (Key takeaways and knowledge gained)

Requirements:
- Use professional, formal language appropriate for academic assessment
- Make activities specific and detailed, showing progression throughout the week
- Include relevant technical terms and industry-specific terminology related to the student's field of study (${userProfile?.course || "the specified course"})
- Tailor the content to match the student's academic discipline and the industry/department they're working in
- Ensure each day has meaningful, distinct activities that are realistic for their field
- Focus on learning, contribution, and professional development appropriate to their course of study
- Keep the tone educational and reflective
- Avoid assuming the student is in a technology-related field unless explicitly specified

Return ONLY a valid JSON object with these exact keys:
{
  "weekSummary": "string",
  "dailyActivities": [
    {
      "day": "string",
      "date": "string",
      "activities": "string"
    }
  ],
  "skillsDeveloped": ["string"],
  "challengesFaced": "string",
  "learningOutcomes": "string"
}

Make sure the content is realistic, educational, demonstrates genuine learning and contribution in a professional environment, and is appropriately tailored to the student's academic background and industry placement.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let logbookEntry;
    try {
      // Remove any potential markdown formatting
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      logbookEntry = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Gemini JSON parse error:", parseError);
      console.error("Generated content:", text);
      throw new Error("Failed to parse Gemini response as JSON");
    }

    return logbookEntry;
  }

  private async generateWithGroq(request: GenerationRequest): Promise<LogContent> {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("Groq API key not configured");
    }

    const { weekNumber, startDate, endDate, activities, userProfile } = request;

    const prompt = `You are an AI assistant helping a SIWES (Students Industrial Work Experience Scheme) student create a professional logbook entry.

Student Information:
- Name: ${userProfile?.full_name || "Student"}
- Course: ${userProfile?.course || "Not specified"}
- Institution: ${userProfile?.institution || "Not specified"}
- Company: ${userProfile?.company_name || "Not specified"}
- Department: ${userProfile?.department || "Not specified"}
- Industry: ${userProfile?.industry_type || "Not specified"}

Week Details:
- Week Number: ${weekNumber}
- Date Range: ${startDate} to ${endDate}
- Activities Summary: ${activities}

Please generate a professional SIWES logbook entry with the following structure:

1. **Week Summary** (2-3 sentences describing the overall focus of the week)
2. **Daily Breakdown** (5 working days with specific activities for each day)
3. **Skills Developed** (List of technical and soft skills gained)
4. **Challenges Faced** (Any difficulties encountered and how they were addressed)
5. **Learning Outcomes** (Key takeaways and knowledge gained)

Requirements:
- Use professional, formal language appropriate for academic assessment
- Make activities specific and detailed, showing progression throughout the week
- Include relevant technical terms and industry-specific terminology related to the student's field of study (${userProfile?.course || "the specified course"})
- Tailor the content to match the student's academic discipline and the industry/department they're working in
- Ensure each day has meaningful, distinct activities that are realistic for their field
- Focus on learning, contribution, and professional development appropriate to their course of study
- Keep the tone educational and reflective
- Avoid assuming the student is in a technology-related field unless explicitly specified

Format the response as a structured JSON object with the following keys:
- weekSummary: string
- dailyActivities: array of objects with {day: string, date: string, activities: string}
- skillsDeveloped: array of strings
- challengesFaced: string
- learningOutcomes: string

Make sure the content is realistic, educational, demonstrates genuine learning and contribution in a professional environment, and is appropriately tailored to the student's academic background and industry placement.`;

    const completion = await this.groqClient.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated from Groq API");
    }

    // Parse JSON response
    let logbookEntry;
    try {
      logbookEntry = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error("Groq JSON parse error:", parseError);
      console.error("Generated content:", generatedContent);
      throw new Error("Failed to parse Groq response as JSON");
    }

    return logbookEntry;
  }
}

// Singleton instance
export const aiProviderManager = new AIProviderManager();
