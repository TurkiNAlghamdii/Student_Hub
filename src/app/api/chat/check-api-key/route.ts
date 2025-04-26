/**
 * OpenAI API Key Validation Endpoint
 * 
 * This API provides a simple way to check if the OpenAI API key
 * configured in the environment variables is valid and properly formatted.
 * It's used by the frontend to determine if the chat functionality should be enabled.
 */

import { NextResponse } from 'next/server';

/**
 * GET endpoint to validate the OpenAI API key configuration
 * 
 * Checks if the API key exists and has a valid format without making an actual API call.
 * This is a lightweight validation that doesn't consume OpenAI API credits.
 * 
 * @returns JSON response indicating whether the API key appears to be valid
 */
export async function GET() {
  try {
    // Retrieve the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    /**
     * Validate the API key format
     * Checks for:
     * 1. Existence (not null or undefined)
     * 2. Not empty or just whitespace
     * 3. Not a placeholder value
     * 4. Correct prefix format (sk- or sk-proj-)
     * 5. Minimum length requirement
     */
    const isValid = 
      apiKey && 
      apiKey.trim() !== '' &&
      apiKey !== 'your-openai-api-key-here' && 
      apiKey !== 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' &&
      (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) &&
      apiKey.length > 20;
    
    // Log an error message if the API key is invalid to help with debugging
    if (!isValid) {
      console.error('Invalid OpenAI API key detected in check-api-key route');
    }
    
    // Return a simple boolean response indicating validity
    // The double negation (!!) ensures we return a boolean value
    return NextResponse.json({ valid: !!isValid });
  } catch (error) {
    // Handle any unexpected errors during validation
    console.error('Error checking API key:', error);
    return NextResponse.json({ valid: false });
  }
}