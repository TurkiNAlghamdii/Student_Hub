/**
 * Email Sending API Route
 * 
 * This API provides functionality for sending emails from the Student Hub application,
 * including:
 * - Validating email request data
 * - Authenticating the sender
 * - Sending formatted emails via SMTP
 * - Logging email activity in the database
 * 
 * The API supports both token-based and cookie-based authentication
 * and includes detailed error handling for common email sending issues.
 */

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client with service role key
 * 
 * This client is used for:
 * - Authenticating users via token or cookie
 * - Retrieving sender information from the database
 * - Logging email activity for auditing purposes
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Configure Nodemailer SMTP Transporter
 * 
 * Sets up the email sending service with configuration from environment variables.
 * Supports various SMTP providers including Gmail, Outlook, and custom SMTP servers.
 * 
 * The TLS configuration allows for development environments where certificates
 * might not be properly set up.
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certs - helpful for development environments
    rejectUnauthorized: false
  }
});

/**
 * Verify SMTP connection on server start
 * 
 * Tests the connection to the SMTP server when the application starts
 * in production environments to catch configuration issues early.
 * 
 * This helps identify email configuration problems before users
 * attempt to send emails.
 */
if (process.env.NODE_ENV !== 'development') {
  transporter.verify(function (error) {
    if (error) {
      console.error('SMTP connection error:', error);
    } else {
      console.log('SMTP server is ready to take our messages');
    }
  });
}

/**
 * Type Definitions
 */

/**
 * Email Request Interface
 * 
 * Defines the expected structure of the request body for sending emails:
 * - to: Recipient email address
 * - subject: Email subject line
 * - message: Email body content
 * - Optional sender information (will be fetched from user profile if not provided)
 */
interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  senderName?: string;
  senderEmail?: string;
  senderStudentId?: string | number;
}

/**
 * Email Error Interface
 * 
 * Extends the standard Error interface with additional properties
 * that might be present in email-related errors.
 */
interface EmailError extends Error {
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * POST endpoint to send an email
 * 
 * Processes email sending requests, authenticates the sender,
 * formats the email with appropriate styling, and sends it via SMTP.
 * 
 * @param request - The incoming HTTP request with email data and authentication
 * @returns JSON response indicating success or detailed error information
 */
export async function POST(request: Request) {
  try {
    /**
     * Authentication Check
     * 
     * Supports two authentication methods:
     * 1. Bearer token in the Authorization header
     * 2. Supabase cookie (sb-*) for browser-based requests
     * 
     * This ensures only authenticated users can send emails through the system.
     */
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    let userId = '';
    
    if (!token) {
      // If no token is provided, check for Supabase cookie authentication
      const cookies = request.headers.get('cookie') || '';
      const supabaseCookie = cookies
        .split(';')
        .find(c => c.trim().startsWith('sb-'));
      
      if (!supabaseCookie) {
        return NextResponse.json(
          { error: 'Unauthorized: Missing authentication' },
          { status: 401 }
        );
      }
    }

    /**
     * Parse and validate request data
     * 
     * Extracts the email details from the request body and performs
     * basic validation to ensure all required fields are present
     * and properly formatted.
     */
    const requestData: EmailRequest = await request.json();
    const { to, subject, message, senderName, senderEmail, senderStudentId } = requestData;

    // Check that all required fields are provided
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required fields' },
        { status: 400 }
      );
    }

    // Validate recipient email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Bad Request: Invalid email format' },
        { status: 400 }
      );
    }

    /**
     * Retrieve sender information
     * 
     * If sender details aren't provided in the request, attempt to fetch them
     * from the user's profile in the database. This ensures emails include
     * proper attribution even when minimal information is provided in the request.
     */
    let senderInfo = {
      name: senderName || '',
      email: senderEmail || '',
      studentId: senderStudentId || ''
    };

    if (!senderName || !senderEmail) {
      try {
        // Fetch authenticated user information from Supabase
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          userId = user.id;
          
          // Retrieve the user's student profile for complete information
          const { data: studentData } = await supabase
            .from('students')
            .select('id, full_name, email, student_id')
            .eq('id', user.id)
            .single();
          
          if (studentData) {
            // Use a combination of profile data and request data, with fallbacks
            senderInfo = {
              name: studentData.full_name || senderName || user.email?.split('@')[0] || '',
              email: studentData.email || senderEmail || user.email || '',
              studentId: studentData.student_id || senderStudentId || ''
            };
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Continue with whatever sender info we have rather than failing
      }
    }

    /**
     * Configure email sender and subject
     * 
     * Uses environment variables for the "from" address and formats
     * the subject line to clearly indicate the source of the email
     * and include the sender's name when available.
     */
    const fromEmail = process.env.EMAIL_FROM || 'noreply@student-hub.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Student Hub';

    // Format subject to include sender name for better context
    const formattedSubject = senderInfo.name 
      ? `[Student Hub] ${senderInfo.name} sent you a message: ${subject}`
      : `[Student Hub] ${subject}`;

    /**
     * Prepare email content with formatting
     * 
     * Creates both plain text and HTML versions of the email with:
     * - Proper attribution of the sender
     * - Styled HTML for better readability
     * - Reply-to header set to the sender's email for direct responses
     * - Footer with sender information and contact details
     */
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: formattedSubject,
      replyTo: senderInfo.email || undefined,  // Enable direct replies to the sender
      text: message + `\n\n—\nSent by ${senderInfo.name || 'a student'} via Student Hub`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #10b981; margin-top: 0;">${subject}</h2>
        <div style="color: #4b5563; line-height: 1.6;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6b7280;">
          <p>This email was sent by ${senderInfo.name || 'a student'}${senderInfo.studentId ? ` (ID: ${senderInfo.studentId})` : ''} via Student Hub.</p>
          <p style="margin-bottom: 5px;">You can reply directly to this email to respond to the sender.</p>
          <div style="background-color: rgba(240, 240, 240, 0.5); border-radius: 4px; padding: 8px; margin-top: 10px;">
            <p style="margin: 0; font-weight: bold; font-size: 11px; color: #4b5563;">Contact directly:</p>
            <p style="margin: 0; font-family: monospace; word-break: break-all;">${senderInfo.email || ''}</p>
          </div>
        </div>
      </div>`,
    };

    try {
      /**
       * Send the email via SMTP
       * Uses the configured transporter to deliver the email
       * and logs the activity for auditing purposes
       */
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', to);

      /**
       * Log the email activity in the database
       * This creates an audit trail of all emails sent through the system
       * which is useful for troubleshooting and monitoring
       */
      await supabase
        .from('email_logs')
        .insert([
          {
            sender_id: userId || null,         // User ID if authenticated
            sender_name: senderInfo.name || null,
            sender_email: senderInfo.email || null,
            recipient_email: to,
            subject,
            sent_at: new Date().toISOString(),
            status: 'delivered',               // Assume delivery was successful
          },
        ])
        .select();

      // Return success response
      return NextResponse.json(
        { message: 'Email sent successfully' },
        { status: 200 }
      );
    } catch (mailError: unknown) {
      /**
       * Handle SMTP-specific errors
       * 
       * Provides user-friendly error messages for common email sending issues,
       * particularly focusing on Gmail-specific authentication problems
       * which are common when setting up email functionality.
       */
      console.error('Error sending email via SMTP:', mailError);
      
      // Extract error message safely from the error object
      const errorMessage = typeof mailError === 'object' && mailError !== null && 'message' in mailError 
        ? (mailError as { message: string }).message 
        : 'Unknown error';
      
      // Generate a user-friendly error message based on the technical error
      let errorResponse = 'Failed to send email. ';
      
      if (errorMessage.includes('Invalid login')) {
        errorResponse += 'Email server login failed. Please check your Gmail username and app password.';
      } else if (errorMessage.includes('certificate')) {
        errorResponse += 'SSL certificate verification failed.';
      } else if (errorMessage.includes('authentication')) {
        errorResponse += 'Authentication failed. Make sure you\'re using an App Password if using Gmail.';
      } else {
        errorResponse += 'Please check your email configuration.';
      }
      
      // Return detailed error information
      return NextResponse.json(
        { error: errorResponse, details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    /**
     * Global error handler
     * Catches any unexpected errors in the overall email sending process
     * that weren't caught by the more specific SMTP error handler
     */
    console.error('Error sending email:', error);
    
    const emailError = error as EmailError;
    
    return NextResponse.json(
      { error: 'Internal Server Error: ' + (emailError.message || 'Failed to send email') },
      { status: 500 }
    );
  }
}