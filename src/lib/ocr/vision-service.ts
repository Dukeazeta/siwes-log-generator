// Google Cloud Vision OCR Service for SIWES Logbook
// Handles text extraction and parsing from logbook images

interface TextAnnotation {
  text?: string;
  pages?: Array<{
    blocks?: Block[];
  }>;
}

interface Block {
  paragraphs?: Paragraph[];
}

interface Paragraph {
  words?: Word[];
}

interface Word {
  symbols?: Symbol[];
}

interface Symbol {
  text?: string;
}

export interface DayActivities {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
}

export interface OCRResult {
  success: boolean;
  fullText: string;
  activities: DayActivities;
  confidence: number;
  warnings?: string[];
}

export class VisionOCRService {
  private apiKey: string;
  private apiEndpoint = "https://vision.googleapis.com/v1/images:annotate";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY || "";
    if (!this.apiKey) {
      console.warn("Google Vision API key not configured");
    }
  }

  /**
   * Convert image file to base64 string
   */
  private async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:image/xxx;base64, prefix
        const base64Content = base64.split(",")[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert buffer to base64 string (for server-side)
   */
  private bufferToBase64(buffer: Buffer): string {
    return buffer.toString("base64");
  }

  /**
   * Extract text from logbook image using DOCUMENT_TEXT_DETECTION
   */
  async extractLogbookText(image: File | Buffer): Promise<OCRResult> {
    if (!this.apiKey) {
      throw new Error("Google Vision API key is not configured");
    }

    try {
      // Convert image to base64
      let base64Image: string;
      if (image instanceof File) {
        base64Image = await this.imageToBase64(image);
      } else {
        base64Image = this.bufferToBase64(image);
      }

      // Prepare API request with DOCUMENT_TEXT_DETECTION for better structure
      const request = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: "DOCUMENT_TEXT_DETECTION",
                maxResults: 1,
              },
            ],
            imageContext: {
              languageHints: ["en", "en-t-i0-handwrit"], // Support handwriting
            },
          },
        ],
      };

      // Make API call
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OCR API error: ${response.statusText} - ${error}`);
      }

      const data = await response.json();
      const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;

      if (!fullTextAnnotation || !fullTextAnnotation.text) {
        return {
          success: false,
          fullText: "",
          activities: {},
          confidence: 0,
          warnings: [
            "No text detected in image. Please ensure the image is clear and contains text.",
          ],
        };
      }

      const fullText = fullTextAnnotation.text;

      // Parse the structured text to extract daily activities
      const activities = this.parseLogbookStructure(fullTextAnnotation);

      return {
        success: true,
        fullText,
        activities,
        confidence: this.calculateConfidence(fullTextAnnotation),
        warnings: this.detectWarnings(activities),
      };
    } catch (error) {
      console.error("OCR extraction failed:", error);
      throw error;
    }
  }

  /**
   * Parse the document structure to identify Monday-Friday sections
   */
  private parseLogbookStructure(annotation: TextAnnotation): DayActivities {
    // First try to parse using the structured blocks if available
    if (annotation.pages && annotation.pages[0]?.blocks) {
      const structuredActivities = this.parseStructuredBlocks(annotation.pages[0].blocks);
      if (Object.keys(structuredActivities).length >= 3) {
        return structuredActivities;
      }
    }

    // Fallback to text-based parsing
    return this.parseTextContent(annotation.text || "");
  }

  /**
   * Parse structured blocks from DOCUMENT_TEXT_DETECTION
   */
  private parseStructuredBlocks(blocks: Block[]): DayActivities {
    const activities: DayActivities = {};
    let currentDay: keyof DayActivities | null = null;
    let dayContent: string[] = [];

    for (const block of blocks) {
      const blockText = this.extractBlockText(block);

      // Check if this block contains a day header
      const detectedDay = this.detectDayHeader(blockText);

      if (detectedDay) {
        // Save previous day's content if exists
        if (currentDay && dayContent.length > 0) {
          activities[currentDay] = this.cleanActivityText(dayContent.join("\n"));
        }

        // Start new day
        currentDay = detectedDay;
        dayContent = [];
      } else if (currentDay) {
        // Add content to current day if it's valid activity content
        if (this.isActivityContent(blockText)) {
          dayContent.push(blockText);
        }
      }
    }

    // Save last day's content
    if (currentDay && dayContent.length > 0) {
      activities[currentDay] = this.cleanActivityText(dayContent.join("\n"));
    }

    return activities;
  }

  /**
   * Extract text from a block structure
   */
  private extractBlockText(block: Block): string {
    if (!block.paragraphs) return "";

    return block.paragraphs
      .map(
        (p: Paragraph) =>
          p.words
            ?.map((w: Word) => w.symbols?.map((s: Symbol) => s.text || "").join("") || "")
            .join(" ") || "",
      )
      .join("\n")
      .trim();
  }

  /**
   * Preprocess text to remove dates and metadata
   */
  private preprocessText(text: string): string {
    // Common date patterns to remove
    const datePatterns = [
      // Full dates with various formats: 10/06/2025, 10-06-2025, 10.06.2025, 10/6/25
      /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,
      // Dates with just month/day: 10/06, 10-06
      /\b\d{1,2}[\/\-\.]\d{1,2}\b(?!\d)/g,
      // Dates with month names: 12 Jan 2024, 12th January, January 12
      /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{0,4}\b/gi,
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?\s*,?\s*\d{0,4}\b/gi,
      // Year ranges: 2023-2024, 2023/2024
      /\b\d{4}[\-\/]\d{4}\b/g,
      // Standalone years that are likely dates (2023, 2024, 2025)
      /\b20\d{2}\b/g,
      // Standalone years that might be 19xx
      /\b19\d{2}\b/g,
      // Time stamps: 09:30, 9:30 AM, 14:00
      /\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi,
      // Date ranges: 12-16 Jan, 12/01 - 16/01
      /\b\d{1,2}[\-\/]\d{1,2}\s*[\-–—]\s*\d{1,2}[\-\/]\d{1,2}\b/g,
      // Week indicators: Week 1, Week 12, Week ending
      /\bweek\s+\d+\b/gi,
      /\bweek\s+ending\b/gi,
      // Email addresses
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
      // URLs
      /https?:\/\/[^\s]+/g,
      /www\.[^\s]+/g,
    ];

    let processedText = text;

    // Remove date patterns
    datePatterns.forEach((pattern) => {
      processedText = processedText.replace(pattern, " ");
    });

    // Clean up extra spaces left by removals
    processedText = processedText.replace(/\s+/g, " ").trim();

    return processedText;
  }

  /**
   * Parse text content using pattern matching
   */
  private parseTextContent(text: string): DayActivities {
    const activities: DayActivities = {};

    // Preprocess to remove dates first
    const preprocessedText = this.preprocessText(text);

    const lines = preprocessedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // More comprehensive day patterns - capture content after day name
    const dayPatterns = {
      monday: /\b(monday|mon\.?|day\s*1|day\s*one)\b[\s:\/\-,.]*(.*)?/i,
      tuesday: /\b(tuesday|tue\.?|tues\.?|day\s*2|day\s*two)\b[\s:\/\-,.]*(.*)?/i,
      wednesday: /\b(wednesday|wed\.?|day\s*3|day\s*three)\b[\s:\/\-,.]*(.*)?/i,
      thursday: /\b(thursday|thu\.?|thur\.?|thurs\.?|day\s*4|day\s*four)\b[\s:\/\-,.]*(.*)?/i,
      friday: /\b(friday|fri\.?|day\s*5|day\s*five)\b[\s:\/\-,.]*(.*)?/i,
    };

    let currentDay: keyof DayActivities | null = null;
    let dayContent: string[] = [];
    let lastDayIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip lines that are just metadata
      if (this.looksLikeMetadata(line)) {
        continue;
      }

      // Check if line is a day header
      let dayFound = false;
      for (const [day, pattern] of Object.entries(dayPatterns)) {
        const match = line.match(pattern);
        if (match) {
          // Save previous day's content
          if (currentDay && dayContent.length > 0) {
            activities[currentDay] = this.cleanActivityText(dayContent.join("\n"));
          }

          currentDay = day as keyof DayActivities;
          dayContent = [];
          dayFound = true;
          lastDayIndex = i;

          // Check if there's content on the same line as the day header
          const remainingText = match[2]?.trim() || "";

          // Clean the remaining text
          const cleanedRemaining = this.cleanLineContent(remainingText);

          if (cleanedRemaining && this.isActivityContent(cleanedRemaining)) {
            dayContent.push(cleanedRemaining);
          }

          break;
        }
      }

      // If not a day header, process as potential content
      if (!dayFound && currentDay) {
        // Clean the line content
        const cleanedLine = this.cleanLineContent(line);

        // Only add if it passes activity content check
        if (cleanedLine && this.isActivityContent(cleanedLine)) {
          // Additional check: if this line is too far from the last day header,
          // it might be misplaced content
          if (i - lastDayIndex <= 15) {
            // Within 15 lines of the day header
            dayContent.push(cleanedLine);
          }
        }
      }
    }

    // Save last day's content
    if (currentDay && dayContent.length > 0) {
      activities[currentDay] = this.cleanActivityText(dayContent.join("\n"));
    }

    // Post-process: If we have very uneven distribution, try to rebalance
    const dayList = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
    const filledDays = dayList.filter((day) => activities[day] && activities[day]!.length > 0);

    // If we have content but it's all in one or two days, might need to re-parse
    if (filledDays.length <= 2 && text.length > 500) {
      // Try alternative parsing with looser patterns
      return this.fallbackParseWithContext(text);
    }

    return activities;
  }

  /**
   * Fallback parsing method that uses context clues
   */
  private fallbackParseWithContext(text: string): DayActivities {
    const activities: DayActivities = {};
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Look for day indicators anywhere in the line
    const dayIndicators = {
      monday: /\b(monday|mon\.?|day\s*1)\b/i,
      tuesday: /\b(tuesday|tue\.?|tues\.?|day\s*2)\b/i,
      wednesday: /\b(wednesday|wed\.?|day\s*3)\b/i,
      thursday: /\b(thursday|thu\.?|thur\.?|thurs\.?|day\s*4)\b/i,
      friday: /\b(friday|fri\.?|day\s*5)\b/i,
    };

    let currentDay: keyof DayActivities | null = null;
    let dayContent: string[] = [];
    const contentBuffer: string[] = [];

    for (const line of lines) {
      // Check if this line contains a day indicator
      let dayFound: keyof DayActivities | null = null;

      for (const [day, pattern] of Object.entries(dayIndicators)) {
        if (pattern.test(line)) {
          dayFound = day as keyof DayActivities;
          break;
        }
      }

      if (dayFound) {
        // Save previous day's content
        if (currentDay && dayContent.length > 0) {
          activities[currentDay] = this.cleanActivityText(dayContent.join("\n"));
        }

        currentDay = dayFound;
        dayContent = [];

        // Extract content from the line, removing the day indicator
        const cleanedLine = line
          .replace(dayIndicators[dayFound], "")
          .replace(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]?\d{0,4}\s*/, "")
          .replace(/^[\-:,.\s]+/, "")
          .trim();

        if (cleanedLine && this.isActivityContent(cleanedLine)) {
          dayContent.push(cleanedLine);
        }
      } else if (currentDay && this.isActivityContent(line)) {
        // Clean and add to current day
        const cleanedLine = line.replace(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]?\d{0,4}\s*/, "").trim();

        if (cleanedLine && this.isActivityContent(cleanedLine)) {
          dayContent.push(cleanedLine);
        }
      } else {
        // Store in buffer for potential use
        contentBuffer.push(line);
      }
    }

    // Save last day's content
    if (currentDay && dayContent.length > 0) {
      activities[currentDay] = this.cleanActivityText(dayContent.join("\n"));
    }

    return activities;
  }

  /**
   * Detect if text contains a day header
   */
  private detectDayHeader(text: string): keyof DayActivities | null {
    const lower = text.toLowerCase().trim();

    // Check for full day names and variations
    if (
      lower.includes("monday") ||
      lower.match(/\bmon\b/) ||
      lower.match(/^mon\./) ||
      lower.includes("day one") ||
      lower.match(/\bday\s*1\b/)
    )
      return "monday";
    if (
      lower.includes("tuesday") ||
      lower.match(/\btue\b/) ||
      lower.match(/^tue\./) ||
      lower.match(/\btues\b/) ||
      lower.includes("day two") ||
      lower.match(/\bday\s*2\b/)
    )
      return "tuesday";
    if (
      lower.includes("wednesday") ||
      lower.match(/\bwed\b/) ||
      lower.match(/^wed\./) ||
      lower.includes("day three") ||
      lower.match(/\bday\s*3\b/)
    )
      return "wednesday";
    if (
      lower.includes("thursday") ||
      lower.match(/\bthu\b/) ||
      lower.match(/^thu\./) ||
      lower.match(/\bthur\b/) ||
      lower.match(/\bthurs\b/) ||
      lower.includes("day four") ||
      lower.match(/\bday\s*4\b/)
    )
      return "thursday";
    if (
      lower.includes("friday") ||
      lower.match(/\bfri\b/) ||
      lower.match(/^fri\./) ||
      lower.includes("day five") ||
      lower.match(/\bday\s*5\b/)
    )
      return "friday";

    return null;
  }

  /**
   * Check if text looks like activity content
   */
  private isActivityContent(text: string): boolean {
    const trimmed = text.trim();

    // Skip empty or too short lines
    if (trimmed.length < 10) return false;

    // Skip obvious non-activity content
    const skipPatterns = [
      /^page\s*\d+$/i,
      /^p\.\s*\d+$/i,
      /^week\s*\d+$/i,
      /^week\s*ending/i,
      /^description\s*of\s*work\s*done/i,
      /^weekly\s*progress\s*chart/i,
      /^signature:?\s*$/i,
      /^supervisor:?\s*$/i,
      /^approved\s*by:?\s*$/i,
      /^date:?\s*$/i,
      /^siwes\s*log/i,
      /^log\s*book$/i,
      /^industrial\s*training/i,
      /^student\s*(name|id):?/i,
      /^company:?/i,
      /^department:?/i,
      /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/, // Date only lines
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // Month names
      /^\d{1,2}(st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // Date formats like "1st Jan"
      /^(january|february|march|april|may|june|july|august|september|october|november|december)/i, // Full month names
      /^\d{4}$/, // Year only
      /^day\s*\d+$/i, // Day number only (without activities)
      /^activity:?\s*$/i, // Activity label without content
      /^activities:?\s*$/i, // Activities label without content
      /^work\s*done:?\s*$/i, // Work done label
      /^tasks?:?\s*$/i, // Task label
      /^remarks?:?\s*$/i, // Remarks label
      /^comments?:?\s*$/i, // Comments label
      /^observations?:?\s*$/i, // Observations label
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, // Email addresses
      /^fupre$/i, // University abbreviation
      /^federal\s*university/i, // University name
      /^_{3,}$/, // Underscores (signature lines)
      /^-{3,}$/, // Dashes (separators)
      /^\.{3,}$/, // Dots (separators)
      /^[=]+$/, // Equal signs (separators)
      /^[\*]+$/, // Asterisks (separators)
    ];

    // Check if line is just metadata
    if (skipPatterns.some((pattern) => pattern.test(trimmed))) {
      return false;
    }

    // Additional checks for dates embedded in text
    // Skip if the line starts with a date
    if (/^\d{1,2}[\/\-\.]\d{1,2}/.test(trimmed)) {
      // But keep if there's substantial text after the date
      const withoutDate = trimmed.replace(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]?\d{0,4}\s*/, "");
      return withoutDate.length > 20;
    }

    // Skip single words or very short phrases
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount < 3) return false;

    return true;
  }

  /**
   * Clean a single line of content
   */
  private cleanLineContent(line: string): string {
    // Remove various date formats and metadata from the line
    const cleaned = line
      // Remove dates anywhere in the line (not just at beginning)
      .replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]?\d{0,4}\b/g, "")
      // Remove month-based dates
      .replace(
        /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{0,4}\b/gi,
        "",
      )
      .replace(
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?\s*,?\s*\d{0,4}\b/gi,
        "",
      )
      // Remove years
      .replace(/\b20\d{2}\b/g, "")
      .replace(/\b19\d{2}\b/g, "")
      // Remove time stamps
      .replace(/\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi, "")
      // Remove leading punctuation and spaces
      .replace(/^[\-:,.\s]+/, "")
      // Remove multiple spaces
      .replace(/\s+/g, " ")
      .trim();

    return cleaned;
  }

  /**
   * Clean extracted activity text
   */
  private cleanActivityText(text: string): string {
    // Split into lines for line-by-line processing
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const cleanedLines: string[] = [];

    for (let line of lines) {
      // Use the common line cleaning function
      line = this.cleanLineContent(line);

      // Remove additional artifacts
      line = line
        .replace(/^\s*[-•*·]\s*/, "") // Remove bullet points
        .replace(/^\d+[\.)]\s*/, "") // Remove numbered lists
        .replace(/\s*\[?\s*\]\s*/g, " ") // Remove empty checkboxes
        .replace(/\s*\[x\]\s*/gi, " ") // Remove checked checkboxes
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      // Only keep lines with actual content
      if (line.length > 10 && !this.looksLikeMetadata(line)) {
        cleanedLines.push(line);
      }
    }

    // Join the cleaned lines
    let cleaned = cleanedLines.join(". ");

    // Clean up punctuation
    cleaned = cleaned
      .replace(/\.\s*\./g, ".") // Remove double periods
      .replace(/[,;]$/, "") // Remove trailing punctuation
      .replace(/\s+/g, " ") // Final whitespace normalization
      .trim();

    // Capitalize first letter if not already
    if (cleaned.length > 0 && /^[a-z]/.test(cleaned)) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Ensure it ends with proper punctuation
    if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
      cleaned += ".";
    }

    return cleaned;
  }

  /**
   * Check if a line looks like metadata rather than activity content
   */
  private looksLikeMetadata(line: string): boolean {
    const metadataPatterns = [
      /^(name|id|department|company|location|supervisor):/i,
      /^week\s*\d+/i,
      /^week\s*ending/i,
      /^description\s*of\s*work\s*done/i,
      /^weekly\s*progress\s*chart/i,
      /^day\s*\d+$/i,
      /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/, // Date only lines
      /^(signed|approved|checked)/i,
      /^page\s*\d+/i,
      /^date:/i,
      /^time:/i,
      /^duration:/i,
      /^activities?:/i,
      /^work\s*done:/i,
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, // Email addresses
    ];

    return metadataPatterns.some((pattern) => pattern.test(line.trim()));
  }

  /**
   * Calculate confidence score based on extraction quality
   */
  private calculateConfidence(annotation: TextAnnotation): number {
    const hasText = annotation.text && annotation.text.length > 0;
    const hasPages = annotation.pages && annotation.pages.length > 0;
    const hasBlocks = (annotation.pages?.[0]?.blocks?.length ?? 0) > 0;
    const textLength = annotation.text?.length || 0;

    let confidence = 0;

    // Base confidence for having text
    if (hasText) confidence += 0.3;

    // Additional confidence for structure
    if (hasPages) confidence += 0.2;
    if (hasBlocks) confidence += 0.2;

    // Confidence based on text length
    if (textLength > 100) confidence += 0.15;
    if (textLength > 500) confidence += 0.15;

    return Math.min(confidence, 1.0);
  }

  /**
   * Detect potential issues with extracted content
   */
  private detectWarnings(activities: DayActivities): string[] {
    const warnings: string[] = [];
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
    const foundDays = days.filter((day) => activities[day] && activities[day]!.length > 0);

    if (foundDays.length === 0) {
      warnings.push(
        "No daily activities detected. Please ensure the image shows a weekly log with Monday-Friday entries.",
      );
    } else if (foundDays.length < 5) {
      const missingDays = days.filter((day) => !activities[day] || activities[day]!.length === 0);
      warnings.push(
        `Missing activities for: ${missingDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}`,
      );
    }

    // Check for very short content
    foundDays.forEach((day) => {
      if (activities[day] && activities[day]!.length < 20) {
        warnings.push(
          `${day.charAt(0).toUpperCase() + day.slice(1)}: Very short content detected. Please review and expand if needed.`,
        );
      }
    });

    return warnings;
  }
}

// Export singleton instance for client-side use
export const ocrService = new VisionOCRService();
