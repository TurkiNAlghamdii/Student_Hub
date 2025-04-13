'use client'

import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar/Navbar'
import SummerTrainingGuide from '@/components/SummerTrainingGuide/SummerTrainingGuide'
import TrainingInstitutionsTable from '@/components/TrainingInstitutionsTable/TrainingInstitutionsTable'
import { BriefcaseIcon } from '@heroicons/react/24/outline'
import './summer-training.css'

export default function SummerTrainingPage() {
  return (
    <div className="summer-training-container">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Section */}
          <div className="welcome-section bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 relative overflow-hidden">
            <div className="welcome-container relative z-1">
              <div className="greeting-content flex items-center gap-4">
                <div className="greeting-icon bg-emerald-500/10 rounded-full p-3 flex items-center justify-center">
                  <BriefcaseIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Summer Training</h1>
                  <p className="text-gray-400 text-sm mt-1">Information about summer training programs and requirements</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="content-section space-y-8">
            <SummerTrainingGuide />
            
            {/* Training Institutions Table */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <TrainingInstitutionsTable />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}