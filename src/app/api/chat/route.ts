import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

// Create an OpenAI API client (only if API key is available)
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || 
      apiKey === 'your-openai-api-key-here' || 
      apiKey === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
    console.error('Invalid or missing OpenAI API key. Please set a valid key in .env.local');
    return null;
  }
  
  return new OpenAI({ apiKey });
};

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages must be an array' },
        { status: 400 }
      );
    }

    // Add system message to guide the AI about its purpose
    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant for students at the university. 
      Your purpose is to help with course materials, create practice test questions, 
      summarize lecture slides, and provide educational support.
      ${context ? `Current context: ${context}` : ''}`
    };
    
    const conversation = [systemMessage, ...messages];

    // Create OpenAI client and check if API key is valid
    const openai = getOpenAIClient();
    if (!openai) {
      throw new Error('Invalid or missing OpenAI API key. Make sure you have set a valid API key in the .env.local file.');
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // More affordable and widely available option
        messages: conversation,
        temperature: 0.7,
        max_tokens: 2000,
      });

      return NextResponse.json({
        message: response.choices[0].message,
      });
    } catch (openaiError) {
      console.error('OpenAI API Error Details:', openaiError);
      let errorMessage = 'Error communicating with OpenAI API';
      
      // Check for specific error types and provide more helpful messages
      if (openaiError instanceof Error) {
        if (openaiError.message.includes('API key')) {
          errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
        } else if (openaiError.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else {
          errorMessage = `OpenAI API Error: ${openaiError.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  } catch (error: unknown) {
    console.error('ChatGPT API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 