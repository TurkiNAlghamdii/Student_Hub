/**
 * Root Layout Component
 * 
 * This is the main layout component for the Student Hub application.
 * It wraps all pages and provides global context providers, styling, and theme handling.
 * 
 * Key features:
 * - Advanced theme system that prevents flash of incorrect theme during navigation
 * - Context providers for authentication, notifications, and theme
 * - Global styling and font configuration
 * - Session management and toast notifications
 * 
 * The theme system uses a client-side script that runs before page hydration to set
 * the correct theme class on the HTML element based on user preference or system settings.
 * This prevents the flash of light content during navigation that was previously an issue.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./chat-styles.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import SessionChecker from '@/components/SessionChecker'
import { Toaster } from 'react-hot-toast'

/**
 * Font Configuration
 * 
 * Setting up the Geist Sans and Geist Mono fonts from Google Fonts.
 * These fonts are loaded with the Next.js font optimization system and
 * made available as CSS variables for use throughout the application.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",  // CSS variable for the sans-serif font
  subsets: ["latin"],           // Only load the Latin character subset for performance
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",  // CSS variable for the monospace font
  subsets: ["latin"],           // Only load the Latin character subset for performance
});

/**
 * Application Metadata
 * 
 * Defines metadata for the application including title, description, and favicon.
 * This information is used by Next.js to populate the <head> section of each page,
 * improving SEO and providing better browser tab identification.
 */
export const metadata: Metadata = {
  title: "Student Hub",                                    // Page title shown in browser tabs
  description: "Student Hub - Your all-in-one academic platform",  // Meta description for SEO
  icons: {
    icon: '/favicon.ico',                                // Favicon for browser tabs
  },
};

/**
 * Root Layout Component
 * 
 * The main layout wrapper for the entire application. This component:
 * 1. Sets up the HTML document structure
 * 2. Implements the theme system with flash prevention
 * 3. Provides context providers for auth, notifications, and theme
 * 4. Configures global styling and fonts
 * 
 * @param children - The page content to be rendered inside this layout
 * @returns The complete HTML document structure with all providers and global components
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* 
         * Theme Initialization Script
         * 
         * This script runs before any React hydration to prevent theme flashing.
         * It performs several critical functions:
         * 1. Retrieves the user's theme preference from localStorage
         * 2. Falls back to system preference if no stored preference exists
         * 3. Applies the theme class to the HTML element immediately
         * 4. Sets the background color directly to prevent flash during navigation
         * 5. Implements a fix for webpack-internal fetch errors during navigation
         * 
         * This approach solves the issue where pages would initially load in light mode
         * before switching to dark mode, causing a flash of light content during navigation.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  try {
                    const storedTheme = window.localStorage.getItem('theme');
                    if (storedTheme) return storedTheme;
                    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  } catch (e) {
                    // localStorage access might be restricted
                    return 'light'; // Default to light if checks fail
                  }
                }
                const theme = getInitialTheme();
                const root = document.documentElement;
                root.classList.remove('light', 'dark'); // Remove potential server-rendered default
                root.classList.add(theme);

                // Apply background color immediately to prevent flash during navigation
                // These colors should match your globals.css variables for :root and .dark
                const bgColor = theme === 'dark' ? '#111827' : '#ffffff';
                root.style.backgroundColor = bgColor;

                // Fix for webpack-internal fetch errors during navigation
                window.addEventListener('beforeunload', function() {
                  // Store current scroll position and theme before navigation
                  try {
                    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
                    // Theme is already stored in localStorage
                  } catch (e) {
                    console.error('Error saving navigation state:', e);
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {/* Context Providers */}
        <AuthProvider>
          <NotificationsProvider>
            <ThemeProvider>
              {/* Session management component */}
              <SessionChecker />
              {/* Main content container */}
              <div className="flex-grow">
                {children}
              </div>
              {/* Portal container for modals */}
              <div id="modal-root"></div>
            </ThemeProvider>
          </NotificationsProvider>
        </AuthProvider>
        {/* Toast notification container */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
