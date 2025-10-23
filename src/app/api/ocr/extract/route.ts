// API route for OCR text extraction from SIWES logbook images
import { VisionOCRService } from "@/lib/ocr/vision-service";
import { NextRequest, NextResponse } from "next/server";

// Configure maximum request size for image uploads
export const maxDuration = 30; // Maximum function duration in seconds
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Check for API key configuration
    if (!process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY && !process.env.GOOGLE_VISION_API_KEY) {
      return NextResponse.json(
        {
          error: "OCR service not configured",
          message:
            "Google Vision API key is missing. Please configure it in environment variables.",
        },
        { status: 503 },
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const weekNumber = formData.get("weekNumber") as string;

    // Validate required fields
    if (!imageFile) {
      return NextResponse.json(
        {
          error: "No image provided",
          message: "Please select an image of your logbook page to process.",
        },
        { status: 400 },
      );
    }

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/heic",
      "image/heif",
    ];
    const fileType = imageFile.type.toLowerCase();

    if (!validTypes.includes(fileType)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          message: `Please upload a valid image file. Supported formats: JPG, PNG, WebP, HEIC`,
        },
        { status: 400 },
      );
    }

    // Check file size (max 10MB for Google Vision API)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        {
          error: "File too large",
          message: "Image size must be less than 10MB. Please compress or resize your image.",
        },
        { status: 400 },
      );
    }

    // Convert file to buffer for processing
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Initialize OCR service with API key from environment
    const apiKey =
      process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;
    const ocrService = new VisionOCRService(apiKey);

    // Perform OCR extraction
    console.log(`Starting OCR extraction for week ${weekNumber || "unknown"}...`);
    const startTime = Date.now();

    const result = await ocrService.extractLogbookText(buffer);

    const processingTime = Date.now() - startTime;
    console.log(`OCR extraction completed in ${processingTime}ms`, {
      success: result.success,
      confidence: result.confidence,
      daysFound: Object.keys(result.activities).length,
      warnings: result.warnings?.length || 0,
    });

    // Add metadata to response
    const response = {
      ...result,
      metadata: {
        weekNumber: weekNumber || null,
        fileName: imageFile.name,
        fileSize: imageFile.size,
        processingTime: processingTime,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("OCR API error:", error);

    // Determine error type and provide appropriate response
    let errorMessage = "Failed to process image";
    let statusCode = 500;

    if (error instanceof Error) {
      // Check for specific Google Vision API errors
      if (error.message.includes("API key")) {
        errorMessage = "OCR service authentication failed. Please check API configuration.";
        statusCode = 401;
      } else if (error.message.includes("quota")) {
        errorMessage = "OCR service quota exceeded. Please try again later.";
        statusCode = 429;
      } else if (error.message.includes("Invalid image")) {
        errorMessage = "The image could not be processed. Please ensure it is a valid image file.";
        statusCode = 400;
      } else {
        errorMessage = `OCR processing failed: ${error.message}`;
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

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
