import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// Define schema for request validation
const supportRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  issue: z.string().min(1, "Issue type is required"),
  description: z.string().min(10, "Description must be at least 10 characters")
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate the request body
    const result = supportRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, issue, description } = result.data;
    
    // Insert into the database
    const { data, error } = await supabaseAdmin
      .from('support_requests')
      .insert([
        {
          email,
          issue_type: issue,
          description,
          status: 'new',
        }
      ])
      .select();
    
    if (error) {
      console.error("Error inserting support request:", error);
      return NextResponse.json(
        { error: "Failed to save support request" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Support request submitted successfully",
      request_id: data[0].id
    });
    
  } catch (error) {
    console.error("Unexpected error processing support request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 