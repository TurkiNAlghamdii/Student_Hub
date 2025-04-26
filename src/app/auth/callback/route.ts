/**
 * Authentication Callback Route
 * 
 * This API handles the callback from Supabase authentication after a user
 * clicks on an email confirmation link. It processes the authentication code,
 * exchanges it for a session, and redirects the user to the login page with
 * an appropriate message.
 * 
 * The flow is:
 * 1. User registers or requests email confirmation
 * 2. User clicks link in the confirmation email
 * 3. Supabase redirects to this callback URL with a code parameter
 * 4. This route exchanges the code for a session
 * 5. The user is redirected to the login page
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET endpoint to process authentication callback
 * 
 * Handles the redirect from Supabase after a user clicks on an email confirmation link.
 * Exchanges the provided code for a session, then redirects the user to the login page
 * with an appropriate success or error message.
 * 
 * @param request - The incoming HTTP request with the code parameter
 * @returns Redirect response to the login page with a status message
 */
export async function GET(request: NextRequest) {
  /**
   * Extract the authentication code from the URL parameters
   * 
   * The code is provided by Supabase as a query parameter when redirecting
   * the user back to our application after they click the confirmation link
   */
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Only proceed if a code is present in the URL
  if (code) {
    /**
     * Initialize Supabase client with cookie-based session handling
     * 
     * This creates a server-side Supabase client that can access and modify
     * the user's session cookies. It's necessary for the code exchange process.
     */
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      /**
       * Exchange the authentication code for a session
       * 
       * This verifies the code with Supabase and creates a valid session.
       * This step confirms the user's email address in the Supabase auth system.
       */
      await supabase.auth.exchangeCodeForSession(code)
      
      /**
       * Sign out immediately to prevent automatic login
       * 
       * We want the user to explicitly log in after confirming their email,
       * rather than being automatically logged in. This provides a clearer
       * user experience and ensures they're aware of the successful confirmation.
       */
      await supabase.auth.signOut()
      
      /**
       * Redirect to login page with success message
       * 
       * After successful confirmation, direct the user to the login page
       * with a message indicating their email was confirmed successfully.
       */
      return NextResponse.redirect(
        new URL('/login?message=Email confirmed successfully! You can now log in.', request.url)
      )
    } catch (error) {
      /**
       * Handle errors during the confirmation process
       * 
       * Possible errors include:
       * - Invalid or expired code
       * - Network issues when communicating with Supabase
       * - Account already confirmed
       * 
       * Log the error for debugging and redirect the user with an error message.
       */
      console.error('Error processing email confirmation:', error)
      return NextResponse.redirect(
        new URL('/login?message=Error confirming email. Please try again or contact support.', request.url)
      )
    }
  }

  /**
   * Handle case where no code is provided
   * 
   * This could happen if:
   * - The URL was manually entered or modified
   * - The email link was corrupted
   * - There's an issue with the Supabase redirect
   * 
   * Redirect to login with an error message explaining the issue.
   */
  return NextResponse.redirect(
    new URL('/login?message=Invalid confirmation link. Please try again or request a new confirmation email.', request.url)
  )
}
