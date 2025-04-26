/**
 * Chat API Route
 * 
 * This API provides an interface to OpenAI's GPT models for the Student Hub's AI assistant feature.
 * It handles sending user messages to OpenAI, managing context, and formatting responses.
 * The API includes error handling for API key issues and rate limiting.
 */

import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates an OpenAI API client instance if a valid API key is available
 * 
 * Validates that the API key is present and not a placeholder value
 * Returns null if the API key is invalid or missing
 * 
 * @returns OpenAI client instance or null if API key is invalid
 */
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

/**
 * POST endpoint to interact with the OpenAI chat API
 * 
 * Processes user messages, adds appropriate context based on the context type,
 * and returns AI-generated responses for the Student Hub chat interface.
 * 
 * @param req - The incoming HTTP request with messages and context information
 * @returns JSON response with the AI-generated message or error details
 */
export async function POST(req: NextRequest) {
  try {
    // Extract messages, context, and contextType from the request body
    const { messages, context, contextType = 'general' } = await req.json();
    
    // Validate that messages is a properly formatted array
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages must be an array' },
        { status: 400 }
      );
    }

    /**
     * Prepare context-specific instructions based on the contextType
     * This helps tailor the AI's responses to different academic scenarios
     */
    let contextMessage = '';
    
    if (contextType === 'course' && context) {
      // For course-specific questions, provide curriculum-relevant information
      contextMessage = `CURRENT CONTEXT: You are helping with the course "${context}". Focus on providing accurate, 
      curriculum-relevant information. Reference common textbooks and topics typically covered in this subject. 
      If asked about assignments, encourage the student to verify information with their professor.`;
    } 
    else if (contextType === 'exam') {
      // For exam preparation, focus on study techniques and practice problems
      contextMessage = `CURRENT CONTEXT: You are helping a student prepare for exams. Focus on providing effective 
      study techniques, creating practice problems, and explaining complex concepts clearly. Help the student 
      develop critical thinking rather than just memorizing facts.`;
    }
    else if (context) {
      // For general context, simply pass it through
      contextMessage = `CURRENT CONTEXT: ${context}`;
    }

    /**
     * Create a system message that defines the AI assistant's behavior
     * This includes capabilities, response style, and ethical limitations
     */
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
    
    // Combine system message with user messages to create the complete conversation
    const conversation = [systemMessage, ...messages];

    // Initialize the OpenAI client and validate API key
    const openai = getOpenAIClient();
    if (!openai) {
      throw new Error('Invalid or missing OpenAI API key. Make sure you have set a valid API key in the .env.local file.');
    }

    try {
      /**
       * Send the conversation to OpenAI's API
       * Uses gpt-3.5-turbo for a balance of quality and cost-effectiveness
       * Temperature of 0.7 provides a good balance of creativity and consistency
       * Max tokens of 2000 allows for detailed responses without excessive length
       */
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // More affordable and widely available option
        messages: conversation,
        temperature: 0.7,
        max_tokens: 2000,
      });

      // Return the AI-generated message to the client
      return NextResponse.json({
        message: response.choices[0].message,
      });
    } catch (openaiError) {
      console.error('OpenAI API Error Details:', openaiError);
      let errorMessage = 'Error communicating with OpenAI API';
      
      /**
       * Provide more specific error messages based on common OpenAI API errors
       * This helps with troubleshooting API key and rate limit issues
       */
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
    /**
     * Global error handler for the API route
     * Catches any errors not handled by the OpenAI-specific error handler
     * Returns a user-friendly error message to the client
     */
    console.error('ChatGPT API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}