// API route for AI-enhanced OCR text processing using Gemini or Groq
import { VisionOCRService } from "@/lib/ocr/vision-service";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Allow more time for AI processing
export const dynamic = "force-dynamic";

interface ProcessedActivities {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check for API keys configuration
    if (!process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY && !process.env.GOOGLE_VISION_API_KEY) {
      return NextResponse.json(
        {
          error: "OCR service not configured",
          message: "Google Vision API key is missing.",
        },
        { status: 503 },
      );
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error: "AI service not configured",
          message: "No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.",
        },
        { status: 503 },
      );
    }

    // Provider flags
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;

    // Parse the multipart form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const weekNumber = formData.get("weekNumber") as string;
    const useAI = formData.get("useAI") !== "false"; // Default to true

    if (!imageFile) {
      return NextResponse.json(
        {
          error: "No image provided",
          message: "Please select an image of your logbook page to process.",
        },
        { status: 400 },
      );
    }

    // Convert file to buffer for OCR processing
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Extract text using Google Vision OCR
    console.log(`Starting OCR extraction for week ${weekNumber || "unknown"}...`);
    const apiKey =
      process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;
    const ocrService = new VisionOCRService(apiKey);

    const ocrResult = await ocrService.extractLogbookText(buffer);

    if (!ocrResult.success || !ocrResult.fullText) {
      return NextResponse.json(
        {
          error: "OCR extraction failed",
          message: "Could not extract text from the image.",
          details: ocrResult.warnings,
        },
        { status: 400 },
      );
    }

    // If AI processing is disabled, return the basic OCR result
    if (!useAI) {
      return NextResponse.json({
        ...ocrResult,
        metadata: {
          weekNumber: weekNumber || null,
          aiProcessed: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Step 2: Use AI to intelligently parse and organize the text
    let aiModelUsed = "";
    const startTime = Date.now();
    const providerLabel = hasGemini ? "Gemini" : hasGroq ? "Groq" : "None";
    console.log(`Processing extracted text with AI provider: ${providerLabel}`);

    // Limit OCR text to prevent token overflows in AI prompts
    const MAX_TEXT_CHARS = Number(process.env.OCR_AI_MAX_CHARS || "15000");
    const ocrInput =
      ocrResult.fullText && ocrResult.fullText.length > MAX_TEXT_CHARS
        ? ocrResult.fullText.slice(0, MAX_TEXT_CHARS)
        : ocrResult.fullText;

    // Create a prompt that preserves original text and only fixes OCR errors
    const prompt = `You are an OCR error correction specialist. Your job is to fix OCR scanning errors while PRESERVING the original student's words as much as possible.

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
- Examples across different fields:
  * Engineering: "Tested the ___ circuit" → "Tested the electrical circuit"
  * Medical/Pharmacy: "Prepared ___ dosage" → "Prepared medication dosage"
  * Agriculture: "Inspected the ___ soil" → "Inspected the farm soil"
  * Business: "Updated the ___ records" → "Updated the financial records"
  * Architecture: "Reviewed the ___ drawings" → "Reviewed the building drawings"

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
- Keep the original text but fix OCR errors

RAW OCR TEXT TO PROCESS:
${ocrInput}

STEP 6 - OUTPUT FORMAT:
Return ONLY a JSON object with the student's original activities, just with OCR errors fixed:
{
  "monday": "Student's original text with OCR errors fixed",
  "tuesday": "Student's original text with OCR errors fixed",
  "wednesday": "Student's original text with OCR errors fixed",
  "thursday": "Student's original text with OCR errors fixed",
  "friday": "Student's original text with OCR errors fixed"
}

Example of CORRECT approach (IT field):
Original OCR: "Helped with priner confguration. Updated the priner system drvers"
Corrected: "Helped with printer configuration. Updated the printer system drivers"
(Only fixed spelling errors, kept original wording)

Example of CORRECT approach (Engineering field):
Original OCR: "Asisted in tesing the elctrical curcuit. Measued voltage and resitance"
Corrected: "Assisted in testing the electrical circuit. Measured voltage and resistance"
(Only fixed spelling errors, kept original wording)

Example of CORRECT approach (Pharmacy field):
Original OCR: "Dispensd medicatons to patints. Verifed prescripion dosges"
Corrected: "Dispensed medications to patients. Verified prescription dosages"
(Only fixed spelling errors, kept original wording)

Example of WRONG approach:
Original OCR: "Helped with equipment setup"
Wrong: "Provided comprehensive technical assistance in the systematic configuration and deployment of advanced laboratory equipment"
(This rewrites the student's text - DON'T do this!)

CRITICAL: Return ONLY the JSON object. Preserve the student's original words - just fix OCR scanning errors and fill obvious gaps.`;

    try {
      let aiResponse = "";

      if (hasGemini) {
        // Use Gemini
        const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
        const geminiModelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
        const model = gemini.getGenerativeModel({
          model: geminiModelName,
          generationConfig: {
            temperature: Number(process.env.AI_TEMPERATURE || "0.1"),
            maxOutputTokens: Number(process.env.AI_MAX_TOKENS || "2048"),
            topP: 0.8,
            topK: 20,
          },
        });

        const result = await model.generateContent(prompt);
        const response = result.response;
        aiResponse = response.text();
        aiModelUsed = geminiModelName;
      } else if (hasGroq) {
        // Use Groq
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
        const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "You are an OCR error correction specialist. Fix OCR scanning errors while preserving the student's original words. Only correct misspellings and fill obvious gaps - do not rewrite or rephrase. The student may be from any academic field (engineering, medicine, agriculture, business, sciences, etc.) so use context to understand field-specific terminology.",
            },
            { role: "user", content: prompt },
          ],
          model: groqModel,
          temperature: Number(process.env.AI_TEMPERATURE || "0.1"),
          max_tokens: Number(process.env.AI_MAX_TOKENS || "2048"),
          top_p: 0.95,
          response_format: { type: "json_object" },
        });
        aiResponse = completion.choices?.[0]?.message?.content || "";
        aiModelUsed = `groq:${groqModel}`;
      } else {
        throw new Error("No AI provider configured");
      }

      console.log("AI response received");
      console.log("Raw AI Response:", aiResponse);
      console.log(
        "Raw OCR Text sent to AI (first 500 chars):",
        ocrResult.fullText.substring(0, 500),
      );

      // Parse the AI response to extract the organized activities
      let processedActivities: ProcessedActivities = {};

      try {
        // Clean the response (remove markdown if present)
        const cleanedResponse = aiResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        processedActivities = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        console.log("AI Response:", aiResponse);

        // Try to extract activities using regex as fallback
        processedActivities = extractActivitiesFromText(aiResponse);
      }

      // Apply intelligent post-processing to improve sentence quality
      processedActivities = intelligentPostProcessing(processedActivities);

      console.log(
        "Processed Activities after parsing:",
        JSON.stringify(processedActivities, null, 2),
      );

      // Validate and clean the processed activities
      const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      const cleanedActivities: ProcessedActivities = {};

      // Function to remove any remaining dates from text
      const removeDatesFromText = (text: string): string => {
        return (
          text
            // Remove dates in various formats with potential OCR errors
            .replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]?\d{0,4}\b/g, "") // 30/06/2025, 10-06-2025
            .replace(/\b\d{1,3}[\/\-]\d{1,4}\b/g, "") // 107/2025, 04/071 (OCR errors)
            .replace(/\b\d{1,2}[\/\-\.]\d{1,3}[\/\-\.]?\d{0,4}\b/g, "") // Handles OCR errors like 04/071/2023
            // Remove partial dates
            .replace(/\b\d{1,2}\/\d{1,2}\b/g, "") // 30/06, 02/07
            // Remove month names with dates
            .replace(
              /\b\d{1,2}(st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{0,4}\b/gi,
              "",
            )
            .replace(
              /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?\s*,?\s*\d{0,4}\b/gi,
              "",
            )
            // Remove standalone years
            .replace(/\b20\d{2}\b/g, "")
            .replace(/\b19\d{2}\b/g, "")
            // Remove common headers that might slip through
            .replace(/\bWEEKLY\s+PROGRESS\s+CHART\b/gi, "")
            .replace(/\bWEEK\s+ENDING\b/gi, "")
            .replace(/\bDescription\s+of\s+Work\s+Done\b/gi, "")
            .replace(/\bNO\s+WORK\b/gi, "")
            // Remove garbled text and random numbers
            .replace(/\b[a-z]{6,}\b/g, (match) => {
              // Remove likely garbled text (long strings without vowels or nonsense)
              const vowelCount = (match.match(/[aeiou]/gi) || []).length;
              return vowelCount < match.length / 3 ? "" : match;
            })
            // Clean up extra spaces and punctuation
            .replace(/\s+/g, " ")
            .replace(/^\s*[,.\-]\s*/, "") // Remove leading punctuation
            .replace(/\s*[,]\s*([,.])/g, "$1") // Fix double punctuation
            .replace(/\s*\.\s*\./g, ".") // Remove double periods
            .trim()
        );
      };

      for (const day of validDays) {
        if (processedActivities[day as keyof ProcessedActivities]) {
          // Clean and validate each day's content
          let content = processedActivities[day as keyof ProcessedActivities]!.trim().replace(
            /\s+/g,
            " ",
          );

          // Remove any dates that AI might have missed
          content = removeDatesFromText(content);

          // Only include if it has meaningful content after cleaning
          if (content.length > 20) {
            cleanedActivities[day as keyof ProcessedActivities] = content;
          }
        }
      }

      // Ensure all 5 days have content - fill missing days with context-aware placeholders
      const missingDays = validDays.filter(
        (day) => !cleanedActivities[day as keyof ProcessedActivities],
      );

      if (missingDays.length > 0 && Object.keys(cleanedActivities).length > 0) {
        console.log("Missing days detected:", missingDays);

        // If we have some days with content, try to infer missing days
        for (const missingDay of missingDays) {
          // Check if there's any text in the original that might belong to this day
          const dayRegex = new RegExp(
            `\\b(${missingDay}|${missingDay.substring(0, 3)}|day\\s*${validDays.indexOf(missingDay) + 1})\\b[\\s\\S]{0,200}`,
            "i",
          );
          const match = ocrResult.fullText.match(dayRegex);

          if (match) {
            // Found some text that might belong to this day
            const extractedText = match[0]
              .replace(dayRegex, "")
              .replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]?\d{0,4}\b/g, "")
              .replace(/\s+/g, " ")
              .trim();

            if (extractedText.length > 20) {
              cleanedActivities[missingDay as keyof ProcessedActivities] =
                `Activities extracted from unclear text: ${extractedText.substring(0, 200)}`;
            } else {
              cleanedActivities[missingDay as keyof ProcessedActivities] =
                "Activities for this day were not clearly captured in the image. Please review and update manually.";
            }
          } else {
            // No text found for this day
            cleanedActivities[missingDay as keyof ProcessedActivities] =
              "No activities detected for this day. The text may be unclear or missing in the scanned image.";
          }
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`AI processing completed in ${processingTime}ms`);
      console.log("Final cleaned activities:", JSON.stringify(cleanedActivities, null, 2));
      console.log("Days found:", Object.keys(cleanedActivities));

      // Calculate confidence based on AI processing
      const originalDaysFound = validDays.filter(
        (day) =>
          cleanedActivities[day as keyof ProcessedActivities] &&
          !cleanedActivities[day as keyof ProcessedActivities]!.includes("not clearly captured") &&
          !cleanedActivities[day as keyof ProcessedActivities]!.includes("No activities detected"),
      ).length;
      const confidence = originalDaysFound / 5; // 0.0 to 1.0 based on originally found days

      // Generate warnings if needed
      const warnings: string[] = [];
      if (originalDaysFound === 0) {
        warnings.push("No activities could be extracted. Please check the image quality.");
      } else if (originalDaysFound < 5) {
        const problematicDays = validDays.filter(
          (day) =>
            cleanedActivities[day as keyof ProcessedActivities]?.includes("not clearly captured") ||
            cleanedActivities[day as keyof ProcessedActivities]?.includes("No activities detected"),
        );
        warnings.push(`Some days need manual review: ${problematicDays.join(", ")}`);
      }

      return NextResponse.json({
        success: true,
        fullText: ocrResult.fullText,
        activities: cleanedActivities,
        confidence,
        warnings,
        metadata: {
          weekNumber: weekNumber || null,
          fileName: imageFile.name,
          fileSize: imageFile.size,
          aiProcessed: true,
          processingTime,
          ocrTime: ocrResult.confidence,
          aiModel: aiModelUsed,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (aiError) {
      console.error("AI processing failed:", aiError);
      console.error("Error details:", aiError instanceof Error ? aiError.message : aiError);
      console.error(
        "OCR text that failed (first 500 chars):",
        ocrResult.fullText.substring(0, 500),
      );

      // Try fallback: Use alternate provider if available
      try {
        if (hasGroq && aiModelUsed.indexOf("groq") === -1) {
          // Primary was Gemini, try Groq as fallback
          console.log("Attempting Groq fallback...");
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
          const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: "system",
                content:
                  "You are an OCR error correction specialist. Fix OCR errors while preserving the original text. Do not rewrite or improve - only correct scanning mistakes. Work with any academic field - use context to identify correct terminology.",
              },
              { role: "user", content: prompt },
            ],
            model: groqModel,
            temperature: 0.1,
            max_tokens: 2048,
            top_p: 0.95,
            response_format: { type: "json_object" },
          });

          const groqText = completion.choices?.[0]?.message?.content || "";
          const groqActivities = JSON.parse(groqText);

          return NextResponse.json({
            success: true,
            fullText: ocrResult.fullText,
            activities: groqActivities,
            confidence: 0.6,
            warnings: ["Used Groq fallback due to primary AI provider error"],
            metadata: {
              weekNumber: weekNumber || null,
              aiProcessed: true,
              aiModel: `groq:${groqModel}`,
              timestamp: new Date().toISOString(),
            },
          });
        } else if (hasGemini && aiModelUsed.indexOf("gemini") === -1) {
          // Primary was Groq, try Gemini as fallback
          console.log("Attempting Gemini fallback...");
          const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
          const geminiModelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
          const model = gemini.getGenerativeModel({
            model: geminiModelName,
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1500,
            },
          });

          const simplifiedPrompt = `You are an OCR correction expert working with SIWES students from various academic fields (engineering, sciences, medicine, agriculture, business, etc.). Extract work activities and fix OCR scanning errors ONLY. Preserve the original text - just fix misspellings and use context to identify field-specific terms. Return JSON with keys: monday, tuesday, wednesday, thursday, friday. Text: ${ocrInput}`;
          const result = await model.generateContent(simplifiedPrompt);
          const response = result.response.text();

          const cleanedResponse = response
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

          const geminiActivities = JSON.parse(cleanedResponse);

          return NextResponse.json({
            success: true,
            fullText: ocrResult.fullText,
            activities: geminiActivities,
            confidence: 0.5,
            warnings: ["Used simplified Gemini fallback due to primary AI provider error"],
            metadata: {
              weekNumber: weekNumber || null,
              aiProcessed: true,
              aiModel: `${geminiModelName}-fallback`,
              timestamp: new Date().toISOString(),
            },
          });
        }

        // If no fallback available, return basic OCR
        return NextResponse.json({
          ...ocrResult,
          metadata: {
            weekNumber: weekNumber || null,
            aiProcessed: false,
            aiError: "AI processing failed, returning basic OCR results",
            timestamp: new Date().toISOString(),
          },
        });
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        // If even fallback fails, return basic OCR
        return NextResponse.json({
          ...ocrResult,
          metadata: {
            weekNumber: weekNumber || null,
            aiProcessed: false,
            aiError: "AI processing failed, returning basic OCR results",
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  } catch (error) {
    console.error("OCR API error:", error);

    let errorMessage = "Failed to process image";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "Service authentication failed. Please check API configuration.";
        statusCode = 401;
      } else if (error.message.includes("quota")) {
        errorMessage = "Service quota exceeded. Please try again later.";
        statusCode = 429;
      } else {
        errorMessage = `Processing failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : String(error)
            : undefined,
      },
      { status: statusCode },
    );
  }
}

// Fallback function to extract activities from text if JSON parsing fails
function extractActivitiesFromText(text: string): ProcessedActivities {
  const activities: ProcessedActivities = {};
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];

  for (const day of days) {
    const dayRegex = new RegExp(`"?${day}"?\\s*:\\s*"([^"]*)"`, "i");
    const match = text.match(dayRegex);
    if (match && match[1]) {
      activities[day as keyof ProcessedActivities] = match[1].trim();
    }
  }

  return activities;
}

// Minimal post-processing to fix only OCR errors, preserve original text
function intelligentPostProcessing(activities: ProcessedActivities): ProcessedActivities {
  const improved: ProcessedActivities = {};
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

  for (const day of days) {
    if (!activities[day]) continue;

    let text = activities[day]!;

    // 1. Fix only common OCR word errors (misspellings from scanning)
    // These are universal corrections that apply across all fields
    const ocrErrors: [RegExp, string][] = [
      // Common misspellings
      [/\bmaintance\b/gi, "maintenance"],
      [/\bmaintnance\b/gi, "maintenance"],
      [/\bequipmnt\b/gi, "equipment"],
      [/\bequipement\b/gi, "equipment"],
      [/\bexperment\b/gi, "experiment"],
      [/\bexperimnt\b/gi, "experiment"],
      [/\bmeasurment\b/gi, "measurement"],
      [/\bmeasuremnts\b/gi, "measurements"],
      [/\bprocedure\b/gi, "procedure"],
      [/\bprocedurs\b/gi, "procedures"],
      [/\banalize\b/gi, "analyze"],
      [/\banalise\b/gi, "analyze"],
      [/\bpatient\b/gi, "patient"],
      [/\bpatints\b/gi, "patients"],
      [/\bmedicaton\b/gi, "medication"],
      [/\bmedicatons\b/gi, "medications"],
      [/\bdocumnt\b/gi, "document"],
      [/\bdocumnts\b/gi, "documents"],
      [/\brecord\b/gi, "record"],
      [/\brecords\b/gi, "records"],
      [/\bsample\b/gi, "sample"],
      [/\bsamples\b/gi, "samples"],
      [/\bmatrial\b/gi, "material"],
      [/\bmatrials\b/gi, "materials"],
      [/\bprocesss\b/gi, "process"],
      [/\bprocedur\b/gi, "procedure"],
    ];

    ocrErrors.forEach(([pattern, replacement]) => {
      text = text.replace(pattern, replacement);
    });

    // 2. Fix basic spacing and punctuation issues only
    text = text
      .replace(/\s+/g, " ") // Multiple spaces to single
      .replace(/\s+([.,!?;:])/g, "$1") // Remove space before punctuation
      .replace(/([.,!?;:])([a-zA-Z])/g, "$1 $2"); // Add space after punctuation

    // 3. Capitalize first letter only if it's lowercase
    if (text.length > 0 && text[0] === text[0].toLowerCase()) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    // 4. Ensure sentence ends with punctuation if missing
    if (text.length > 0 && !text.match(/[.!?]$/)) {
      text += ".";
    }

    // 5. Fix double punctuation
    text = text.replace(/\.+/g, ".").replace(/\s*\.\s*\./g, ".");

    // 6. Remove duplicate words (OCR errors)
    text = text
      .replace(/\b(\w+)\s+\1\b/gi, "$1") // Remove immediate duplicates like "the the"
      .trim();

    if (text.length > 10) {
      improved[day] = text;
    }
  }

  return improved;
}
