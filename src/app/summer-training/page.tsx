'use client'

import Navbar from '@/components/Navbar/Navbar'
import SummerTrainingGuide from '@/components/SummerTrainingGuide/SummerTrainingGuide'
import TrainingInstitutionsTable from '@/components/TrainingInstitutionsTable/TrainingInstitutionsTable'
import { BriefcaseIcon } from '@heroicons/react/24/outline'
import AnimatedContent from '@/components/AnimatedContent'
import './summer-training.css'

export default function SummerTrainingPage() {
  return (
    <div className="summer-training-container">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedContent>
          {/* Header Section */}
          <div className="welcome-section rounded-2xl p-6 relative overflow-hidden">
            <div className="welcome-container relative z-1">
              <div className="greeting-content flex items-center gap-4">
                <div className="greeting-icon rounded-full p-3 flex items-center justify-center">
                  <BriefcaseIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold dark:text-white text-gray-800">Summer Training</h1>
                  <p className="dark:text-gray-400 text-gray-600 text-sm mt-1">Information about summer training programs and requirements</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="content-section space-y-8">
            <SummerTrainingGuide />
            
            {/* Training Institutions Table */}
            <div className="dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/80 dark:border-gray-700/50 bg-gradient-to-br from-white/80 to-gray-100/80 border-gray-200/50 backdrop-blur-sm rounded-2xl p-6 border">
              <TrainingInstitutionsTable />
            </div>
          </div>
        </AnimatedContent>
      </main>
    </div>
  )
}