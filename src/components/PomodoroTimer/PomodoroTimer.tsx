'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayIcon, PauseIcon, ArrowPathIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/solid'
import './PomodoroTimer.css'

interface TimerState {
  mode: 'work' | 'break'
  timeLeft: number
  isActive: boolean
  workDuration: number
  breakDuration: number
}

export default function PomodoroTimer() {
  const [timerState, setTimerState] = useState<TimerState>({
    mode: 'work',
    timeLeft: 25 * 60, // 25 minutes in seconds
    isActive: false,
    workDuration: 25 * 60,
    breakDuration: 5 * 60
  })
  const [showSettings, setShowSettings] = useState(false)
  const [workInput, setWorkInput] = useState('25')
  const [breakInput, setBreakInput] = useState('5')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize Web Audio API
  useEffect(() => {
    return () => {
      // Clean up audio context on unmount
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
      }
    }
  }, [])

  // Function to play notification sound using Web Audio API
  const playNotificationSound = () => {
    try {
      // Create audio context on first use
      if (!audioContextRef.current) {
        // Use proper typing for the WebKit Audio Context
        type WebkitWindow = Window & {
          webkitAudioContext: typeof AudioContext;
        };
        
        audioContextRef.current = new (window.AudioContext || 
          (window as unknown as WebkitWindow).webkitAudioContext)();
      }
      
      const context = audioContextRef.current
      
      // Create oscillator for notification sound
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      // Configure sound
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(timerState.mode === 'work' ? 880 : 587.33, context.currentTime) // A5 for work completion, D5 for break completion
      
      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, context.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.7, context.currentTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 1.5)
      
      // Start and stop
      oscillator.start(context.currentTime)
      oscillator.stop(context.currentTime + 1.5)
    } catch (e) {
      console.error('Error playing notification sound:', e)
    }
  }

  // Timer logic
  useEffect(() => {
    if (timerState.isActive) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeLeft <= 1) {
            // Play sound when timer completes
            playNotificationSound()
            
            // Switch modes when timer ends
            if (prev.mode === 'work') {
              // Send browser notification if permitted
              if (Notification.permission === 'granted') {
                new Notification('Break Time!', {
                  body: 'Good job! Time to take a break.',
                  icon: '/favicon.ico'
                })
              }
              return {
                ...prev,
                mode: 'break',
                timeLeft: prev.breakDuration,
              }
            } else {
              // Send browser notification if permitted
              if (Notification.permission === 'granted') {
                new Notification('Work Time!', {
                  body: 'Break is over. Time to focus!',
                  icon: '/favicon.ico'
                })
              }
              return {
                ...prev,
                mode: 'work',
                timeLeft: prev.workDuration,
              }
            }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timerState.isActive, playNotificationSound])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission()
    }
  }, [])

  const startTimer = () => {
    setTimerState(prev => ({ ...prev, isActive: true }))
  }

  const pauseTimer = () => {
    setTimerState(prev => ({ ...prev, isActive: false }))
  }

  const resetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      timeLeft: prev.mode === 'work' ? prev.workDuration : prev.breakDuration,
      isActive: false
    }))
  }

  const toggleMode = () => {
    setTimerState(prev => ({
      ...prev,
      mode: prev.mode === 'work' ? 'break' : 'work',
      timeLeft: prev.mode === 'work' ? prev.breakDuration : prev.workDuration,
      isActive: false
    }))
  }

  const saveSettings = () => {
    const newWorkDuration = Math.max(1, parseInt(workInput)) * 60
    const newBreakDuration = Math.max(1, parseInt(breakInput)) * 60
    
    setTimerState(prev => ({
      ...prev,
      workDuration: newWorkDuration,
      breakDuration: newBreakDuration,
      timeLeft: prev.mode === 'work' ? newWorkDuration : newBreakDuration,
      isActive: false
    }))
    
    setShowSettings(false)
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`pomodoro-container ${timerState.mode === 'work' ? 'work-mode' : 'break-mode'}`}>
      <div className="pomodoro-card">
        <div className="pomodoro-header">
          <h2>Pomodoro Timer</h2>
          <span className="mode-badge">
            {timerState.mode === 'work' ? 'Focus Time' : 'Break Time'}
          </span>
        </div>

        <div className="timer-display">
          <div className="time">{formatTime(timerState.timeLeft)}</div>
          <div className="progress-ring">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle
                className="progress-ring-circle-bg"
                cx="110"
                cy="110"
                r="100"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                className="progress-ring-circle"
                cx="110"
                cy="110"
                r="100"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="628.3"
                strokeDashoffset={
                  628.3 * 
                  (1 - timerState.timeLeft / 
                    (timerState.mode === 'work' 
                      ? timerState.workDuration 
                      : timerState.breakDuration)
                  )
                }
              />
            </svg>
          </div>
        </div>

        <div className="timer-controls">
          {!timerState.isActive ? (
            <button 
              className="control-button start" 
              onClick={startTimer}
              aria-label="Start Timer"
            >
              <PlayIcon className="h-6 w-6" />
            </button>
          ) : (
            <button 
              className="control-button pause" 
              onClick={pauseTimer}
              aria-label="Pause Timer"
            >
              <PauseIcon className="h-6 w-6" />
            </button>
          )}
          
          <button 
            className="control-button reset" 
            onClick={resetTimer}
            aria-label="Reset Timer"
          >
            <ArrowPathIcon className="h-6 w-6" />
          </button>

          <button 
            className="control-button settings" 
            onClick={() => setShowSettings(true)}
            aria-label="Timer Settings"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>
        </div>

        <button 
          className="mode-toggle-button" 
          onClick={toggleMode}
        >
          Switch to {timerState.mode === 'work' ? 'Break' : 'Work'} Mode
        </button>

        {showSettings && (
          <div className="settings-modal">
            <div className="settings-content">
              <div className="settings-header">
                <h3>Timer Settings</h3>
                <button 
                  className="close-settings" 
                  onClick={() => setShowSettings(false)}
                  aria-label="Close Settings"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="settings-form">
                <div className="settings-field">
                  <label htmlFor="work-duration">Work Duration (minutes)</label>
                  <input
                    id="work-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={workInput}
                    onChange={(e) => setWorkInput(e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="break-duration">Break Duration (minutes)</label>
                  <input
                    id="break-duration"
                    type="number"
                    min="1"
                    max="30"
                    value={breakInput}
                    onChange={(e) => setBreakInput(e.target.value)}
                  />
                </div>
                <button 
                  className="save-settings-button" 
                  onClick={saveSettings}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 