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
    const { messages, context, contextType = 'general' } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages must be an array' },
        { status: 400 }
      );
    }

    // Prepare a more detailed context message based on the context type
    let contextMessage = '';
    
    if (contextType === 'course' && context) {
      contextMessage = `CURRENT CONTEXT: You are helping with the course "${context}". Focus on providing accurate, 
      curriculum-relevant information. Reference common textbooks and topics typically covered in this subject. 
      If asked about assignments, encourage the student to verify information with their professor.`;
    } 
    else if (contextType === 'exam') {
      contextMessage = `CURRENT CONTEXT: You are helping a student prepare for exams. Focus on providing effective 
      study techniques, creating practice problems, and explaining complex concepts clearly. Help the student 
      develop critical thinking rather than just memorizing facts.`;
    }
    else if (context) {
      contextMessage = `CURRENT CONTEXT: ${context}`;
    }

    // Add system message to guide the AI about its purpose
    const systemMessage = {
      role: 'system',
      content: `You are an advanced AI academic assistant for university students, designed to provide comprehensive educational support.

CAPABILITIES:
- Create detailed practice questions with answer explanations tailored to course content
- Generate study guides and summarize lecture materials
- Help understand complex academic concepts with clear explanations
- Provide step-by-step solutions to problems
- Suggest relevant resources and study strategies
- Assist with academic research questions
- Help with time management and study planning
- Explain coding concepts and debug simple code

RESPONSE STYLE:
- Be friendly, encouraging, and patient
- Use concise language but include comprehensive details when needed
- Break down complex topics into digestible parts
- Use examples to illustrate difficult concepts
- Format responses with headings, bullet points, and numbered lists for clarity
- When providing explanations, include real-world applications when relevant
- For mathematical or scientific questions, explain underlying principles not just solutions

LIMITATIONS:
- Clarify when you're unsure about specific information
- Don't provide answers to active exams or quizzes
- Don't write complete essays or assignments for students
- Encourage critical thinking rather than just providing solutions

${contextMessage}
`
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