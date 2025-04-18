import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./chat-styles.css";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
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

                // REMOVED: Apply background color immediately - This causes hydration mismatch
                // These colors should match your globals.css variables for :root and .dark
                // const bgColor = theme === 'dark' ? '#111827' : '#ffffff'; 
                // root.style.backgroundColor = bgColor;
              })();
            `,
          }}
        />
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
