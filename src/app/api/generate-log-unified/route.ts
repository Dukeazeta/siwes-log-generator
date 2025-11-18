import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';

export const maxDuration = 60; // Allow more time for AI processing
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { weekNumber, startDate, endDate, activities, userProfile } = await request.json();

    // Validate required fields
    if (!weekNumber || !startDate || !endDate || !activities) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Generating log with enhanced AI service for:', { weekNumber, startDate, endDate, userProfile: userProfile?.full_name });

    // Generate logbook entry using our enhanced AI service
    const result = await aiService.generateLogbookEntry({
      weekNumber,
      startDate,
      endDate,
      activities,
      userProfile
    });

    // Transform the result to match the expected format for the frontend
    const formattedResult = {
      weekSummary: result.object.weekSummary || `Week ${weekNumber} focused on ${activities.toLowerCase()}`,
      dailyActivities: result.object.dailyActivities || [
        {
          day: 'Monday',
          date: '',
          activities: 'I worked on assigned tasks and learning objectives'
        },
        {
          day: 'Tuesday',
          date: '',
          activities: 'I continued with my assigned activities'
        },
        {
          day: 'Wednesday',
          date: '',
          activities: 'I engaged in practical work and skill development'
        },
        {
          day: 'Thursday',
          date: '',
          activities: 'I applied my knowledge to real-world scenarios'
        },
        {
          day: 'Friday',
          date: '',
          activities: 'I completed weekly tasks and documented my progress'
        }
      ],
      skillsDeveloped: result.object.skillsDeveloped || [],
      challengesFaced: result.object.challengesFaced || '',
      learningOutcomes: result.object.learningOutcomes || ''
    };

    return NextResponse.json({
      success: true,
      data: formattedResult,
    });

  } catch (error) {
    console.error('Error generating logbook entry:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate logbook entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}