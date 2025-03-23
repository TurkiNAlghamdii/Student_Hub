import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Check if API key exists and has a valid format
    // Both traditional API keys (sk-...) and project API keys (sk-proj-...) are supported
    const isValid = 
      apiKey && 
      apiKey.trim() !== '' &&
      apiKey !== 'your-openai-api-key-here' && 
      apiKey !== 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' &&
      (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) &&
      apiKey.length > 20;
    
    // For debugging
    if (!isValid) {
      console.error('Invalid OpenAI API key detected in check-api-key route');
    }
    
    return NextResponse.json({ valid: !!isValid });
  } catch (error) {
    console.error('Error checking API key:', error);
    return NextResponse.json({ valid: false });
  }
} 