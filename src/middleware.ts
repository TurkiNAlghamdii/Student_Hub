/**
 * Middleware Module for Session Management
 *
 * This middleware is responsible for handling authentication sessions across the application.
 * It intercepts requests to ensure user sessions are valid and refreshed as needed.
 * 
 * Key features:
 * - Automatic session refreshing
 * - Secure cookie management
 * - Integration with Supabase Auth
 * - Transparent handling of expired sessions
 * - Preservation of request context
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware function that runs on every request
 * 
 * This function:
 * 1. Creates a middleware Supabase client with the request context
 * 2. Retrieves and refreshes the user's session if needed
 * 3. Returns the response with updated session cookies
 * 
 * The middleware runs before the request reaches the application code,
 * ensuring that all routes have access to the most up-to-date session information.
 * If a session is expired, Supabase will attempt to refresh it automatically.
 * 
 * @param req - The incoming Next.js request object
 * @returns The modified response with updated session cookies
 */
export async function middleware(req: NextRequest) {
  // Create a response object that we can modify
  const res = NextResponse.next()
  
  // Create a Supabase client specifically for middleware use
  const supabase = createMiddlewareClient({ req, res })
  
  // Get the user's session, refreshing it if needed
  // This updates cookies in the response automatically
  await supabase.auth.getSession()
  
  // Return the response with potentially modified cookies
  return res
}

// Specify which routes should be handled by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - landing page
     * - login/register pages
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|landing|login|register).*)',
  ],
}
