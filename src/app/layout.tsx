import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./chat-styles.css";
import "../styles/rssapp-overrides.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import SessionChecker from '@/components/SessionChecker'
import { Toaster } from 'react-hot-toast'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student Hub",
  description: "Student Hub - Your all-in-one academic platform",
  icons: {
    icon: '/favicon.ico',
  },
};

// Client component to handle theme initialization without hydration mismatches
function ThemeInitializer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Apply theme immediately to prevent flash of incorrect theme
              function applyTheme() {
                // Remove any existing classes to start fresh
                document.documentElement.classList.remove('dark', 'light');
                
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'dark' || storedTheme === 'light') {
                  document.documentElement.classList.add(storedTheme);
                  if (storedTheme === 'dark') {
                    document.documentElement.style.backgroundColor = '#111827';
                  } else {
                    document.documentElement.style.backgroundColor = '#f9fafb';
                  }
                } else {
                  // Check system preference if no stored theme
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
                  document.documentElement.style.backgroundColor = prefersDark ? '#111827' : '#f9fafb';
                }
              }
              
              // Apply theme immediately during script execution
              applyTheme();
              
              // Also set up a listener for theme changes during navigation
              document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible') {
                  applyTheme();
                }
              });
            } catch (e) {
              // Fail silently if localStorage is not available
              console.error('Error accessing localStorage:', e);
            }
          })();
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ThemeInitializer />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <NotificationsProvider>
            <ThemeProvider>
              <SessionChecker />
              <div className="flex-grow">
                {children}
              </div>
              <div id="modal-root"></div>
            </ThemeProvider>
          </NotificationsProvider>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
