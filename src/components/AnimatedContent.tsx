/**
 * AnimatedContent Component
 *
 * A reusable wrapper component that adds smooth fade-in and slide-up animations
 * to its children using Framer Motion. This component helps create a consistent
 * and polished user experience across the application by standardizing entry
 * animations for content.
 *
 * Key features:
 * - Provides a subtle fade-in and slide-up animation for content
 * - Maintains consistent animation timing across the application
 * - Works with any content or component as children
 * - Respects the application's theme system
 */

'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * Props interface for the AnimatedContent component
 * @property children - React nodes to be rendered with animation effects
 */
interface AnimatedContentProps {
  children: ReactNode
}

/**
 * AnimatedContent component implementation
 * 
 * @param props - Component props
 * @param props.children - Content to be animated
 * @returns React component with animated children
 */
export default function AnimatedContent({ children }: AnimatedContentProps) {
  return (
    <motion.div 
      // Add vertical spacing between child elements
      className="space-y-6"
      // Initial state: invisible and slightly below final position
      initial={{ opacity: 0, y: 20 }}
      // Animated state: fully visible and in final position
      animate={{ opacity: 1, y: 0 }}
      // Animation configuration: smooth easing over 0.5 seconds
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}