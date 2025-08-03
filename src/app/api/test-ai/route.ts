import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function GET() {
  try {
    console.log('Testing Groq API connection...');
    console.log('Groq API Key exists:', !!process.env.GROQ_API_KEY);
    console.log('Groq API Key prefix:', process.env.GROQ_API_KEY?.substring(0, 10));

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'Groq API key not configured',
        recommendation: 'Get your free Groq API key from https://console.groq.com'
      });
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Simple test call to Groq
    console.log('Making test call to Groq...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from Groq!" in JSON format with a "message" field.',
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 50,
      response_format: { type: 'json_object' },
    });

    const generatedContent = completion.choices[0]?.message?.content;
    console.log('Groq API Success Response:', generatedContent);

    return NextResponse.json({
      success: true,
      service: 'Groq',
      message: 'Groq API is working!',
      response: generatedContent || 'No content returned',
      model: 'llama-3.3-70b-versatile',
      credits: 'Free tier: 14,400 requests/day'
    });
  } catch (error) {
    console.error('Groq API Test Error:', error);
    return NextResponse.json({
      success: false,
      service: 'Groq',
      error: 'Connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      recommendation: 'Check your Groq API key and internet connection'
    });
  }
}
