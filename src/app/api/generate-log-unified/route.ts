import { NextRequest, NextResponse } from 'next/server';
import { aiProviderManager } from '../../../lib/ai-provider-manager';

export async function POST(request: NextRequest) {
  try {
    // Debug: Log all headers to see what we're receiving
    console.log('API Route - All headers:', Object.fromEntries(request.headers.entries()));

    // Get user info from middleware headers
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    console.log('API Route - User info from headers:', { userId, userEmail });

    if (!userId) {
      console.error('API Route - No userId found in headers');
      return NextResponse.json(
        {
          error: 'Authentication required. Please log in again.',
          debug: {
            headersReceived: Object.fromEntries(request.headers.entries()),
            userIdFound: !!userId,
            userEmailFound: !!userEmail
          }
        },
        { status: 401 }
      );
    }

    console.log(`AI API request from user: ${userEmail} (${userId})`);

    // Check if required API keys are configured
    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'No AI API keys configured. Please add GEMINI_API_KEY or GROQ_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const { weekNumber, startDate, endDate, activities, userProfile, provider } = await request.json();

    // Validate required fields
    if (!weekNumber || !startDate || !endDate || !activities) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Set provider preference if specified
    if (provider && ['gemini', 'groq', 'auto'].includes(provider)) {
      aiProviderManager.setProvider(provider);
    }

    console.log('Generating log with AI Provider Manager for:', { 
      weekNumber, 
      startDate, 
      endDate, 
      userProfile: userProfile?.full_name,
      preferredProvider: aiProviderManager.getProvider()
    });

    // Generate the logbook entry using the AI provider manager
    const logbookEntry = await aiProviderManager.generateLog({
      weekNumber,
      startDate,
      endDate,
      activities,
      userProfile,
    });

    // Get current usage stats and health for response
    const usageStats = aiProviderManager.getUsageStats();
    const healthStats = aiProviderManager.getProviderHealth();

    return NextResponse.json({
      success: true,
      data: logbookEntry,
      meta: {
        provider: aiProviderManager.getProvider(),
        usage: usageStats,
        health: healthStats,
      },
    });

  } catch (error) {
    console.error('Error generating logbook entry:', error);
    
    // Get current health stats for error response
    const healthStats = aiProviderManager.getProviderHealth();
    
    return NextResponse.json(
      { 
        error: 'Failed to generate logbook entry',
        details: error instanceof Error ? error.message : 'Unknown error',
        health: healthStats,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check provider status
export async function GET() {
  try {
    const usageStats = aiProviderManager.getUsageStats();
    const healthStats = aiProviderManager.getProviderHealth();
    const currentProvider = aiProviderManager.getProvider();

    return NextResponse.json({
      currentProvider,
      usage: usageStats,
      health: healthStats,
      apiKeysConfigured: {
        gemini: !!process.env.GEMINI_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
      },
    });
  } catch (error) {
    console.error('Error getting provider status:', error);
    return NextResponse.json(
      { error: 'Failed to get provider status' },
      { status: 500 }
    );
  }
}