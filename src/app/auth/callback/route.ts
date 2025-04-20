import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code)
      
      // Sign out immediately to prevent automatic login
      await supabase.auth.signOut()
      
      // Redirect to login page with success message
      return NextResponse.redirect(
        new URL('/login?message=Email confirmed successfully! You can now log in.', request.url)
      )
    } catch (error) {
      console.error('Error processing email confirmation:', error)
      return NextResponse.redirect(
        new URL('/login?message=Error confirming email. Please try again or contact support.', request.url)
      )
    }
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(
    new URL('/login?message=Invalid confirmation link. Please try again or request a new confirmation email.', request.url)
  )
}
