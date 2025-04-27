'use client';

/**
 * Custom 404 Not Found Page
 * 
 * This component provides a visually appealing 404 error page that matches
 * the application's emerald color scheme and design patterns.
 * 
 * Key features:
 * - Animated particles with randomized motion
 * - Floating 404 text with glow effects
 * - Responsive layout for mobile and desktop
 * - Theme-aware styling (supports light/dark mode)
 * - Navigation options to go back or return home
 * - Accessibility support for keyboard navigation
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import './not-found.css';

/**
 * Particle Component
 * 
 * Renders a single animated particle with randomized properties:
 * - Random position (X/Y coordinates)
 * - Random size
 * - Random animation duration
 * - Fade in/out effect
 * 
 * @param delay - Optional delay before animation starts (in seconds)
 */
const Particle = ({ delay = 0 }: { delay?: number }) => {
  const randomX = Math.random() * 100 - 50; // -50 to 50
  const randomY = Math.random() * 100 - 50; // -50 to 50
  const randomSize = Math.random() * 3 + 1; // 1 to 4
  const randomDuration = Math.random() * 10 + 15; // 15 to 25 seconds

  return (
    <motion.div
      initial={{ 
        x: 0, 
        y: 0, 
        opacity: 0,
        scale: 0 
      }}
      animate={{ 
        x: randomX, 
        y: randomY, 
        opacity: [0, 0.4, 0.2, 0.4, 0],
        scale: [0, 1, 0.8, 1, 0] 
      }}
      transition={{ 
        duration: randomDuration, 
        delay, 
        repeat: Infinity,
        ease: "easeInOut" 
      }}
      className="absolute rounded-full bg-primary/30"
      style={{ 
        width: `${randomSize}rem`, 
        height: `${randomSize}rem`,
        filter: 'blur(8px)'
      }}
    />
  );
};

/**
 * NotFound Component
 * 
 * Main 404 page component that renders the error message, animations,
 * and navigation options. Uses CSS variables for theming and adapts
 * to the application's light/dark mode.
 */
export default function NotFound() {
  // State to track if component is mounted (for client-side rendering)
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Handler for the "Go Back" button
   * Uses the router to navigate to the previous page
   */
  const handleGoBack = () => {
    router.back();
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-foreground pattern-bg overflow-hidden">
      <div className="relative max-w-md w-full flex flex-col items-center">
        {/* Animated background particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Particle key={i} delay={i * 0.5} />
        ))}
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-10 w-full flex flex-col items-center"
        >
          {/* 404 text with floating animation */}
          <div className="relative float-animation">
            {/* Large 404 background text */}
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="text-[12rem] font-bold text-primary/20 leading-none glow"
            >
              404
            </motion.span>
            {/* Centered "Page Not Found" text */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-3xl font-semibold text-primary glow">Page Not Found</span>
            </motion.div>
          </div>

          {/* Explanatory text */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-4 text-center text-muted-foreground"
          >
            The page you're looking for doesn't exist or has been moved.
          </motion.p>

          {/* Navigation buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center"
          >
            {/* Go Back button */}
            <button
              onClick={handleGoBack}
              className="not-found-button flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-background border border-border hover:bg-accent"
              tabIndex={0}
              aria-label="Go back"
              onKeyDown={(e) => e.key === 'Enter' && handleGoBack()}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Go Back</span>
            </button>
            
            {/* Go to Home button */}
            <Link 
              href="/"
              className="not-found-button primary-button flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-primary-foreground"
              tabIndex={0}
              aria-label="Go to home page"
            >
              <HomeIcon className="h-4 w-4" />
              <span>Go to Home</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 