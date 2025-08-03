import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured. Please add your Groq API key to .env.local' },
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

    console.log('Generating log with Groq for:', { weekNumber, startDate, endDate, userProfile: userProfile?.full_name });

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

Format the response as a structured JSON object with the following keys:
- weekSummary: string
- dailyActivities: array of objects with {day: string, date: string, activities: string}
- skillsDeveloped: array of strings
- challengesFaced: string
- learningOutcomes: string

Make sure the content is realistic, educational, and demonstrates genuine learning and contribution in a professional environment.`;

    // Generate the logbook entry using Groq
    console.log('Calling Groq API...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1500,
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

    return NextResponse.json({
      success: true,
      data: logbookEntry,
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
