import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'xAI API key not configured' },
        { status: 500 }
      );
    }

    const { weekNumber, startDate, endDate, activities, userProfile } = await request.json();

    // Validate required fields
    if (!weekNumber || !startDate || !endDate || !activities) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Generating log with xAI for:', { weekNumber, startDate, endDate, userProfile: userProfile?.full_name });

    // Create the prompt for generating SIWES logbook entry
    const prompt = `You are an AI assistant helping a SIWES (Students Industrial Work Experience Scheme) student create a professional logbook entry.

Student Information:
- Name: ${userProfile?.full_name || 'Student'}
- Course: ${userProfile?.course || 'Not specified'}
- Company: ${userProfile?.company_name || 'Not specified'}
- Department: ${userProfile?.department || 'Not specified'}

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
- Include relevant technical terms related to the student's field
- Ensure each day has meaningful, distinct activities
- Focus on learning, contribution, and professional development
- Keep the tone educational and reflective

Format the response as a JSON object with the following structure:
{
  "weekSummary": "string",
  "dailyActivities": [
    {"day": "Monday", "date": "DD/MM/YYYY", "activities": "string"},
    {"day": "Tuesday", "date": "DD/MM/YYYY", "activities": "string"},
    {"day": "Wednesday", "date": "DD/MM/YYYY", "activities": "string"},
    {"day": "Thursday", "date": "DD/MM/YYYY", "activities": "string"},
    {"day": "Friday", "date": "DD/MM/YYYY", "activities": "string"}
  ],
  "skillsDeveloped": ["skill1", "skill2", "skill3"],
  "challengesFaced": "string",
  "learningOutcomes": "string"
}

Make sure the content is realistic, educational, and demonstrates genuine learning and contribution in a professional environment. Return ONLY the JSON object, no additional text.`;

    // Call xAI API
    console.log('Calling xAI API...');
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'grok-beta',
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('xAI API error:', response.status, errorData);
      throw new Error(`xAI API error: ${response.status} - ${errorData}`);
    }

    const completion = await response.json();
    console.log('xAI API response received');

    const generatedContent = completion.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from xAI API');
    }

    console.log('Parsing generated content...');
    // Parse the JSON response
    let logbookEntry;
    try {
      // Clean the response in case there's extra text
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : generatedContent;
      logbookEntry = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Generated content:', generatedContent);
      throw new Error('Failed to parse generated content as JSON');
    }

    return NextResponse.json({
      success: true,
      data: logbookEntry,
    });

  } catch (error) {
    console.error('Error generating logbook entry:', error);

    // Return detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      type: typeof error,
      error: error
    });

    return NextResponse.json(
      {
        error: 'Failed to generate logbook entry',
        details: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          stack: errorStack,
          type: typeof error
        } : undefined
      },
      { status: 500 }
    );
  }
}
