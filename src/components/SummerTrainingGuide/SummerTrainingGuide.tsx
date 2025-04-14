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

interface Prerequisite {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ProgramGuide {
  title: string;
  description: string;
  prerequisites: Prerequisite[];
  applicationSteps: string[];
  duration: string;
  credits: string;
  icon: React.ReactNode;
}

const programGuides: Record<string, ProgramGuide> = {
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

const SummerTrainingGuide: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold dark:text-white text-gray-800 mb-4">Summer Training Guide</h2>
        <p className="dark:text-gray-400 text-gray-600">Find detailed information about summer training requirements and application process for your program</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(programGuides).map(([key, guide]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/80 dark:border-gray-700/50 bg-gradient-to-br from-white/80 to-gray-100/80 border-gray-200/50 backdrop-blur-sm rounded-2xl p-6 border shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-2">
                  {guide.icon}
                </div>
                <h3 className="text-xl font-semibold dark:text-white text-gray-800">{guide.title}</h3>
              </div>
              <p className="dark:text-gray-400 text-gray-600 text-sm">{guide.description}</p>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium dark:text-white text-gray-800 mb-4">Prerequisites</h4>
                <div className="space-y-4">
                  {guide.prerequisites.map((prereq, index) => (
                    <div key={index} className="flex items-start gap-3">
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

              <div className="flex items-center justify-between pt-4 dark:border-gray-700/50 border-gray-200/50 border-t">
                <div className="flex items-center gap-2 dark:text-gray-400 text-gray-600">
                  <div className="dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-1.5">
                    <ClockIcon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-sm">{guide.duration}</span>
                </div>
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