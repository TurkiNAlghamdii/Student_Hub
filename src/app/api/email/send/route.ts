import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  }
});

// Verify transporter is working on server start
if (process.env.NODE_ENV !== 'development') {
  transporter.verify(function (error) {
    if (error) {
      console.error('SMTP connection error:', error);
    } else {
      console.log('SMTP server is ready to take our messages');
    }
  });
}

// Interface for the request body
interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  senderName?: string;
  senderEmail?: string;
  senderStudentId?: string | number;
}

interface EmailError extends Error {
  message: string;
  code?: string;
  statusCode?: number;
}

export async function POST(request: Request) {
  try {
    // Get user session to authenticate the request
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    let userId = '';
    
    if (!token) {
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

    // Parse request body
    const requestData: EmailRequest = await request.json();
    const { to, subject, message, senderName, senderEmail, senderStudentId } = requestData;

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Bad Request: Invalid email format' },
        { status: 400 }
      );
    }

    // If sender information isn't provided, get it from the current user session
    let senderInfo = {
      name: senderName || '',
      email: senderEmail || '',
      studentId: senderStudentId || ''
    };

    if (!senderName || !senderEmail) {
      try {
        // Get current user's information
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          userId = user.id;
          
          // Get student profile
          const { data: studentData } = await supabase
            .from('students')
            .select('id, full_name, email, student_id')
            .eq('id', user.id)
            .single();
          
          if (studentData) {
            senderInfo = {
              name: studentData.full_name || senderName || user.email?.split('@')[0] || '',
              email: studentData.email || senderEmail || user.email || '',
              studentId: studentData.student_id || senderStudentId || ''
            };
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Continue with whatever sender info we have
      }
    }

    // Get sender's email from environment variables or use a default
    const fromEmail = process.env.EMAIL_FROM || 'noreply@student-hub.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Student Hub';

    // Format subject to include sender
    const formattedSubject = senderInfo.name 
      ? `[Student Hub] ${senderInfo.name} sent you a message: ${subject}`
      : `[Student Hub] ${subject}`;

    // Send email
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: formattedSubject,
      replyTo: senderInfo.email || undefined,
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
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', to);

      // Log the email activity
      await supabase
        .from('email_logs')
        .insert([
          {
            sender_id: userId || null,
            sender_name: senderInfo.name || null,
            sender_email: senderInfo.email || null,
            recipient_email: to,
            subject,
            sent_at: new Date().toISOString(),
            status: 'delivered',
          },
        ])
        .select();

      return NextResponse.json(
        { message: 'Email sent successfully' },
        { status: 200 }
      );
    } catch (mailError: unknown) {
      console.error('Error sending email via SMTP:', mailError);
      
      // Check for common Gmail errors
      const errorMessage = typeof mailError === 'object' && mailError !== null && 'message' in mailError 
        ? (mailError as { message: string }).message 
        : 'Unknown error';
      
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
      
      return NextResponse.json(
        { error: errorResponse, details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    
    const emailError = error as EmailError;
    
    return NextResponse.json(
      { error: 'Internal Server Error: ' + (emailError.message || 'Failed to send email') },
      { status: 500 }
    );
  }
} 