'use client'

import Navbar from '@/components/Navbar/Navbar'
import PomodoroTimer from '@/components/PomodoroTimer/PomodoroTimer'
import Footer from '@/components/Footer/Footer'
import { ClockIcon } from '@heroicons/react/24/outline'

export default function PomodoroPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
            <ClockIcon className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold dark:text-white">Pomodoro Timer</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Boost your productivity with the Pomodoro Technique. Work in focused sessions separated by short breaks.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PomodoroTimer />
          </div>
          
          <div className="bg-white dark:bg-gray-900/80 shadow-md dark:shadow-xl dark:shadow-black/20 rounded-xl p-6 border border-gray-200 dark:border-gray-800 h-fit">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">How to Use the Pomodoro Technique</h2>
            
            <ol className="space-y-4 text-gray-600 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">1</span>
                <span><strong>Choose a task</strong> you want to accomplish.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">2</span>
                <span><strong>Set the timer</strong> for 25 minutes (or your preferred work duration).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">3</span>
                <span><strong>Work on the task</strong> with full focus until the timer rings.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">4</span>
                <span><strong>Take a short break</strong> (5 minutes) to rest and recharge.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-medium">5</span>
                <span><strong>Repeat</strong> the process. After 4 pomodoros, take a longer break (15-30 minutes).</span>
              </li>
            </ol>
            
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Benefits</h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                <li>Improves focus and concentration</li>
                <li>Reduces mental fatigue</li>
                <li>Increases accountability</li>
                <li>Helps manage distractions</li>
                <li>Makes tasks less overwhelming</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 