/**
 * SummerTrainingGuide Component
 *
 * This component displays comprehensive information about summer training programs
 * for different academic disciplines (IT, IS, CS). It provides students with details
 * about prerequisites, application steps, duration, and credits for each program.
 *
 * Key features:
 * - Responsive grid layout that adapts to different screen sizes
 * - Animated cards using Framer Motion for enhanced user experience
 * - Theme-aware styling that adapts to light/dark mode
 * - Consistent iconography using Heroicons
 * - Structured data presentation for easy scanning and comprehension
 */

'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon,
  UserGroupIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

/**
 * Interface for a training prerequisite
 * @property title - Short name of the prerequisite
 * @property description - Detailed explanation of the requirement
 * @property icon - React component to visually represent the prerequisite
 */
interface Prerequisite {
  title: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Interface for a complete program guide
 * @property title - Name of the academic program
 * @property description - Brief overview of the training program
 * @property prerequisites - Array of requirements students must meet
 * @property applicationSteps - Ordered list of steps in the application process
 * @property duration - Expected length of the training program
 * @property credits - Number of credit hours awarded
 * @property icon - React component to visually represent the program
 */
interface ProgramGuide {
  title: string;
  description: string;
  prerequisites: Prerequisite[];
  applicationSteps: string[];
  duration: string;
  credits: string;
  icon: React.ReactNode;
}

/**
 * Data structure containing information about each academic program's training requirements
 * Organized as a record with program codes as keys (it, is, cs) and ProgramGuide objects as values
 * Each program includes specific details while sharing a common data structure
 * 
 * The emerald color theme is used consistently across all programs for visual cohesion
 */
const programGuides: Record<string, ProgramGuide> = {
  // Information Technology program guide
  it: {
    title: "Information Technology",
    description: "Summer training program for IT students focusing on practical industry experience",
    icon: <BriefcaseIcon className="h-8 w-8 text-emerald-400" />,
    prerequisites: [
      {
        title: "Section Plan Hours",
        description: "Completed at least 100 hours from the section plan",
        icon: <ClockIcon className="h-6 w-6" />
      },
      {
        title: "Required Course",
        description: "Completed CPIS 334 course",
        icon: <BookOpenIcon className="h-6 w-6" />
      }
    ],
    applicationSteps: [
      "Submit online application through the student portal",
      "Attach required documents (transcript, CV, student ID)",
      "Get department approval",
      "Find a suitable training opportunity",
      "Submit training agreement for final approval"
    ],
    duration: "8-12 weeks",
    credits: "200 hours"
  },
  
  // Information Systems program guide
  is: {
    title: "Information Systems",
    description: "Summer training program for IS students emphasizing business and technology integration",
    icon: <BuildingOfficeIcon className="h-8 w-8 text-emerald-400" />,
    prerequisites: [
      {
        title: "Section Plan Hours",
        description: "Completed at least 100 hours from the section plan",
        icon: <ClockIcon className="h-6 w-6" />
      },
      {
        title: "Required Course",
        description: "Completed CPIS 334 course",
        icon: <BookOpenIcon className="h-6 w-6" />
      }
    ],
    applicationSteps: [
      "Submit online application through the student portal",
      "Attach required documents (transcript, CV, student ID)",
      "Get department approval",
      "Find a suitable training opportunity",
      "Submit training agreement for final approval"
    ],
    duration: "8-12 weeks",
    credits: "200 hours"
  },
  
  // Computer Science program guide
  cs: {
    title: "Computer Science",
    description: "Summer training program for CS students focusing on software development and research",
    icon: <CodeBracketIcon className="h-8 w-8 text-emerald-400" />,
    prerequisites: [
      {
        title: "Section Plan Hours",
        description: "Completed at least 100 hours from the section plan",
        icon: <ClockIcon className="h-6 w-6" />
      },
      {
        title: "Required Course",
        description: "Completed CPIS 334 course",
        icon: <BookOpenIcon className="h-6 w-6" />
      }
    ],
    applicationSteps: [
      "Submit online application through the student portal",
      "Attach required documents (transcript, CV, student ID)",
      "Get department approval",
      "Find a suitable training opportunity",
      "Submit training agreement for final approval"
    ],
    duration: "8-12 weeks",
    credits: "200 hours"
  }
};

/**
 * SummerTrainingGuide component implementation
 * Renders a responsive grid of program guides with animated cards
 * 
 * @returns React component displaying summer training information for different programs
 */
const SummerTrainingGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header section with title and description */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold dark:text-white text-gray-800 mb-4">Summer Training Guide</h2>
        <p className="dark:text-gray-400 text-gray-600">Find detailed information about summer training requirements and application process for your program</p>
      </div>

      {/* Responsive grid layout - 1 column on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Map through each program guide and create an animated card */}
        {Object.entries(programGuides).map(([key, guide]) => (
          <motion.div
            key={key}
            // Animation settings for a subtle entrance effect
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            // Card styling with theme-aware classes (dark: prefix for dark mode)
            // Uses gradient backgrounds, backdrop blur, and subtle hover effects
            className="dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/80 dark:border-gray-700/50 bg-gradient-to-br from-white/80 to-gray-100/80 border-gray-200/50 backdrop-blur-sm rounded-2xl p-6 border shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            {/* Program header with icon and title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-2">
                  {guide.icon}
                </div>
                <h3 className="text-xl font-semibold dark:text-white text-gray-800">{guide.title}</h3>
              </div>
              <p className="dark:text-gray-400 text-gray-600 text-sm">{guide.description}</p>
            </div>

            {/* Program details sections */}
            <div className="space-y-6">
              {/* Prerequisites section */}
              <div>
                <h4 className="text-lg font-medium dark:text-white text-gray-800 mb-4">Prerequisites</h4>
                <div className="space-y-4">
                  {guide.prerequisites.map((prereq, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {/* Icon container with theme-aware background */}
                      <div className="text-emerald-400 mt-1 dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-1.5">
                        {prereq.icon}
                      </div>
                      <div>
                        <h5 className="dark:text-white text-gray-800 font-medium">{prereq.title}</h5>
                        <p className="dark:text-gray-400 text-gray-600 text-sm">{prereq.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application steps section with numbered list */}
              <div>
                <h4 className="text-lg font-medium dark:text-white text-gray-800 mb-4">Application Steps</h4>
                <ol className="space-y-2">
                  {guide.applicationSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 dark:text-gray-400 text-gray-600 text-sm">
                      <span className="text-emerald-400 font-medium">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Footer with duration and credits information */}
              <div className="flex items-center justify-between pt-4 dark:border-gray-700/50 border-gray-200/50 border-t">
                {/* Duration display */}
                <div className="flex items-center gap-2 dark:text-gray-400 text-gray-600">
                  <div className="dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-1.5">
                    <ClockIcon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-sm">{guide.duration}</span>
                </div>
                {/* Credits display */}
                <div className="flex items-center gap-2 dark:text-gray-400 text-gray-600">
                  <div className="dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-1.5">
                    <UserGroupIcon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-sm">{guide.credits}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SummerTrainingGuide;