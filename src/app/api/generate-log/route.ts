import { NextRequest, NextResponse } from 'next/server';
import { aiService, AIServiceError } from '@/lib/ai/service';

// Fallback to original Groq implementation if AI SDK fails
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

    let logbookEntry;
    let provider = 'unknown';
    let model = 'unknown';

    // Try AI SDK first if available
    if (aiService.isAvailable()) {
      console.log('Using AI SDK for log generation...');
      try {
        const result = await aiService.generateLogbookEntry({
          weekNumber,
          startDate,
          endDate,
          activities,
          userProfile,
        });

        logbookEntry = result.object;
        provider = result.provider;
        model = result.model;

        console.log(`✅ Successfully generated logbook entry using ${provider} (${model})`);
      } catch (aiError) {
        console.warn('❌ AI SDK failed, falling back to original implementation:', aiError);

        if (aiError instanceof AIServiceError) {
          console.error('AI Service Error:', aiError.message, 'Provider:', aiError.provider);
        }

        // Fallback to original Groq implementation
        logbookEntry = await generateWithOriginalGroq(weekNumber, startDate, endDate, activities, userProfile);
        provider = 'groq-fallback';
        model = 'llama-3.1-8b-instant';
      }
    } else {
      console.log('AI SDK not available, using original Groq implementation...');
      // AI SDK not configured, use original implementation
      logbookEntry = await generateWithOriginalGroq(weekNumber, startDate, endDate, activities, userProfile);
      provider = 'groq-original';
      model = 'llama-3.1-8b-instant';
    }

    return NextResponse.json({
      success: true,
      data: logbookEntry,
      metadata: {
        provider,
        model,
        timestamp: new Date().toISOString(),
      },
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

// Original Groq implementation as fallback
async function generateWithOriginalGroq(
  weekNumber: number,
  startDate: string,
  endDate: string,
  activities: string,
  userProfile?: {
    full_name?: string;
    course?: string;
    institution?: string;
    company_name?: string;
    department?: string;
    industry_type?: string;
  }
) {
  // Check if API key is configured
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  // Create the prompt for generating SIWES logbook entry
  const prompt = `You are ${userProfile?.full_name || 'a SIWES student'}, creating a personal logbook entry for week ${weekNumber} (${startDate} to ${endDate}).

Student Profile:
- I am studying ${userProfile?.course || 'my course'}
- I'm doing my SIWES at ${userProfile?.company_name || 'my company'} in the ${userProfile?.department || 'department'}
- This week I focused on: ${activities}

CRITICAL REQUIREMENTS:
1. **Start EVERY daily activity with "I"** - this is mandatory
2. **Make it personal and concise** - 1-2 sentences per activity maximum
3. **Use first-person throughout** - "I learned", "I discovered", "I struggled with"
4. **Be specific and authentic** - real actions, not generic statements
5. **Keep it conversational** - like a student talking about their week

Examples:
❌ Wrong: "On Monday, I was assigned the responsibility of assisting..."
✅ Right: "I helped configure the network switches and documented the setup."

❌ Wrong: "During Tuesday, I participated in the implementation of..."
✅ Right: "I implemented the user authentication module and tested it."

Generate a SIWES logbook entry with:
1. **Week Summary** (1-2 concise sentences)
2. **Daily Breakdown** (5 days, each starting with "I" and being 1-2 sentences max)
3. **Skills Developed** (3-4 specific skills)
4. **Challenges Faced** (1-2 sentences about real challenges)
5. **Learning Outcomes** (2-3 sentences about key learnings)

Return as JSON with keys: weekSummary, dailyActivities (array of {day, date, activities}), skillsDeveloped, challengesFaced, learningOutcomes.

Make this sound authentic and personal!`;

  console.log('Calling original Groq API...');
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.3, // Lower temperature for more consistent personal tone
    max_tokens: 800, // Reduced tokens for shorter, more concise responses
    response_format: { type: 'json_object' },
  });

  console.log('Groq API response received');
  const generatedContent = completion.choices[0]?.message?.content;

  if (!generatedContent) {
    throw new Error('No content generated from Groq API');
  }

  console.log('Parsing generated content...');
  // Parse the JSON response
  let logbookEntry;
  try {
    logbookEntry = JSON.parse(generatedContent);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Generated content:', generatedContent);
    throw new Error('Failed to parse generated content as JSON');
  }

  return logbookEntry;
}
