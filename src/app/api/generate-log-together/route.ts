import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.TOGETHER_API_KEY) {
      return NextResponse.json(
        { error: 'Together AI API key not configured' },
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

    console.log('Generating log with Together AI for:', { weekNumber, startDate, endDate, userProfile: userProfile?.full_name });

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
  "skillsDeveloped": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "challengesFaced": "string",
  "learningOutcomes": "string"
}

Make sure the content is realistic, educational, and demonstrates genuine learning and contribution in a professional environment. Return ONLY the JSON object, no additional text or formatting.`;

    // Call Together AI API
    console.log('Calling Together AI API...');
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3-8b-chat-hf', // Free tier model
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        repetition_penalty: 1.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Together AI API error:', response.status, errorData);
      throw new Error(`Together AI API error: ${response.status} - ${errorData}`);
    }

    const completion = await response.json();
    console.log('Together AI API response received');

    const generatedContent = completion.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from Together AI API');
    }

    console.log('Parsing generated content...');
    // Parse the JSON response
    let logbookEntry;
    try {
      // Clean the response in case there's extra text
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : generatedContent;
      logbookEntry = JSON.parse(jsonString);
      
      // Validate the structure
      if (!logbookEntry.weekSummary || !logbookEntry.dailyActivities || !Array.isArray(logbookEntry.dailyActivities)) {
        throw new Error('Invalid response structure');
      }
      
      // Ensure we have 5 daily activities
      if (logbookEntry.dailyActivities.length !== 5) {
        console.warn('Unexpected number of daily activities, using fallback structure');
        throw new Error('Invalid daily activities structure');
      }
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Generated content:', generatedContent);
      
      // Fallback to structured generation if JSON parsing fails
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const startDateObj = new Date(startDate);
      
      logbookEntry = {
        weekSummary: `During Week ${weekNumber}, I focused on ${activities.toLowerCase()}. This week provided valuable hands-on experience in my field of study, allowing me to apply theoretical knowledge in a practical professional environment and contribute meaningfully to the organization's objectives.`,
        dailyActivities: days.map((day, index) => {
          const currentDate = new Date(startDateObj);
          currentDate.setDate(startDateObj.getDate() + index);
          return {
            day,
            date: currentDate.toLocaleDateString('en-GB'),
            activities: `Engaged in ${activities.toLowerCase()} and related professional activities, focusing on practical application of academic knowledge and skill development.`
          };
        }),
        skillsDeveloped: [
          "Professional communication and interpersonal skills",
          "Technical problem-solving and analytical thinking",
          "Team collaboration and project management",
          "Industry-specific tools and software proficiency",
          "Time management and organizational abilities"
        ],
        challengesFaced: "Initially faced challenges adapting to the professional work environment and understanding industry-specific processes. Overcame these through active learning, seeking guidance from supervisors, and consistent practice.",
        learningOutcomes: "Gained practical understanding of how theoretical knowledge applies in real-world scenarios. Developed professional skills, better understanding of industry practices, and enhanced problem-solving abilities through hands-on experience."
      };
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
