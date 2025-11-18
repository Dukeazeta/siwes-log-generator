import { NextRequest, NextResponse } from 'next/server';
import { aiService, AIServiceError } from '@/lib/ai/service';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { weekNumber, startDate, endDate, activities, userProfile } = await request.json();

    // Validate required fields
    if (!weekNumber || !startDate || !endDate || !activities) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Generating logbook entry:', { weekNumber, startDate, endDate, userProfile: userProfile?.full_name });

    // Generate logbook entry using AI service (Google Gemini)
    const result = await aiService.generateLogbookEntry({
      weekNumber,
      startDate,
      endDate,
      activities,
      userProfile,
    });

    console.log(`✅ Successfully generated logbook entry using ${result.provider} (${result.model})`);

    return NextResponse.json({
      success: true,
      data: result.object,
      provider: result.provider,
      model: result.model,
    });

  } catch (error) {
    console.error('Error generating logbook entry:', error);

    if (error instanceof AIServiceError) {
      console.error('AI Service Error:', error.message);
      return NextResponse.json(
        {
          error: 'AI service failed',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate logbook entry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}