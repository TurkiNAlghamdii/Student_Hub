/**
 * Pomodoro Timer Component
 * 
 * This client-side component implements a Pomodoro technique timer to help users
 * manage their study sessions with focused work periods and regular breaks.
 * 
 * Key features:
 * - Configurable work and break durations
 * - Visual progress tracking with circular progress indicator
 * - Audio notifications when timers complete
 * - Browser notifications (with permission)
 * - Session counter to track completed cycles
 * - Mobile-responsive design with device detection
 * 
 * The component integrates with the application's theme system through CSS classes
 * defined in PomodoroTimer.css that adapt to both light and dark modes based on the
 * root element's theme class. This prevents theme flashing during navigation by using
 * theme-aware selectors rather than hardcoded color values in the JSX.
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { PlayIcon, PauseIcon, ArrowPathIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/solid'
import './PomodoroTimer.css'

/**
 * Timer State Interface
 * 
 * Defines the structure of the timer's state object, managing all aspects of
 * the Pomodoro timer functionality.
 * 
 * @property mode - Current timer mode ('work' or 'break')
 * @property timeLeft - Remaining time in seconds for the current mode
 * @property isActive - Whether the timer is currently running
 * @property workDuration - Configured duration for work periods in seconds
 * @property breakDuration - Configured duration for break periods in seconds
 * @property completedCycles - Number of completed work-break cycles
 */
interface TimerState {
  mode: 'work' | 'break'
  timeLeft: number
  isActive: boolean
  workDuration: number
  breakDuration: number
  completedCycles: number
}

/**
 * Pomodoro Timer Component
 * 
 * A productivity timer implementing the Pomodoro technique with customizable
 * work and break durations. The component provides visual feedback, audio alerts,
 * and browser notifications to help users maintain focus and take regular breaks.
 * 
 * The component uses CSS classes defined in PomodoroTimer.css that adapt to the
 * application's theme system, supporting both light and dark modes through the root
 * element's theme class. This ensures consistent visual appearance across theme changes
 * and prevents theme flashing during navigation.
 * 
 * @returns React component for the Pomodoro timer
 */
export default function PomodoroTimer() {
  // Main timer state managing mode, durations, and active status
  const [timerState, setTimerState] = useState<TimerState>({
    mode: 'work',
    timeLeft: 25 * 60, // 25 minutes in seconds
    isActive: false,
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    completedCycles: 0
  })

  // UI state for settings panel
  const [showSettings, setShowSettings] = useState(false)
  const [workInput, setWorkInput] = useState('25')
  const [breakInput, setBreakInput] = useState('5')

  // Audio notification state and refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const [audioInitialized, setAudioInitialized] = useState(false)

  // Browser notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false)
  const [notificationsAvailable, setNotificationsAvailable] = useState<boolean>(false)

  // Device detection for responsive behavior
  const [isMobile, setIsMobile] = useState<boolean>(false)

  /**
   * Initialize Web Audio API
   * 
   * Creates an AudioContext for playing notification sounds when timers complete.
   * The initialization is deferred until the first user interaction to comply with
   * browser autoplay policies that prevent audio from playing without user gesture.
   * 
   * The function handles cross-browser compatibility with proper TypeScript typing
   * for WebKit implementations and includes error handling for unsupported browsers.
   */
  const initAudio = useCallback(() => {
    if (!audioInitialized) {
      try {
        // Use proper typing for the WebKit Audio Context
        type WebkitWindow = Window & {
          webkitAudioContext: typeof AudioContext;
        };

        // First check if Web Audio API is supported
        if (typeof window !== 'undefined' &&
          (window.AudioContext || (window as unknown as WebkitWindow).webkitAudioContext)) {
          audioContextRef.current = new (window.AudioContext ||
            (window as unknown as WebkitWindow).webkitAudioContext)();
          setAudioInitialized(true);
        } else {
          console.warn('Web Audio API is not supported in this browser');
        }
      } catch (e) {
        console.error('Could not initialize audio context:', e);
      }
    }
  }, [audioInitialized]);

  /**
   * Cleanup Audio Context
   * 
   * Properly closes the AudioContext when the component unmounts to prevent
   * memory leaks and resource consumption. This is important for maintaining
   * application performance, especially on mobile devices with limited resources.
   */
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
      }
    }
  }, [])

  /**
   * Initialize Device Detection and Notification Support
   * 
   * Performs two important initialization tasks on component mount:
   * 1. Detects if the user is on a mobile device to adjust timer behavior
   *    for better performance on mobile browsers
   * 2. Checks if browser notifications are supported and already permitted
   * 
   * The mobile detection is also updated on window resize to handle orientation
   * changes and device switching in responsive layouts.
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()

    if (typeof Notification !== 'undefined') {
      setNotificationsAvailable(true)
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true)
      }
    } else {
      setNotificationsAvailable(false)
    }

    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  /**
   * Play Notification Sound
   * 
   * Generates and plays a simple beep sound when timers complete using the Web Audio API.
   * The function includes several important features:
   * - Error handling to prevent crashes if audio fails
   * - Resuming suspended audio contexts (common on mobile browsers)
   * - Creating a simple oscillator tone with appropriate volume
   * - Automatically stopping the sound after a short duration
   * 
   * The sound is designed to be noticeable but not jarring, with a medium-high
   * frequency (800Hz) and moderate volume (0.5 gain).
   */
  const playSound = useCallback(() => {
    try {
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      // Resume audio context for mobile browsers that require user interaction
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.5;

      oscillator.start();

      setTimeout(() => {
        oscillator.stop();
      }, 500);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }, []);

  // Request notification permission with better mobile handling
  const requestNotificationPermission = useCallback(async () => {
    if (!notificationsAvailable) return

    
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotificationsEnabled(true)
    } else {
      setNotificationsEnabled(false)
    }
  }, [notificationsAvailable]);

  // Send notification with better error handling
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (notificationsAvailable) {
      try {
        new Notification(title, options);
      } catch (error) {
        console.error('Notification error:', error);
      }
    } else {
      console.log('Notifications not available or permission not granted');
    }
  }, [notificationsAvailable]);

  // Trigger notification based on mode
  const triggerNotification = useCallback(() => {
    playSound();
    
    if (notificationsEnabled) {
      const icon = "/favicon.ico";
      const title = timerState.mode === 'work' ? "Break Time!" : "Time to Focus!";
      const body = timerState.mode === 'work' ? "Take a break!" : "Back to work!";
      
      showNotification(title, { body, icon });
    }
  }, [timerState.mode, notificationsEnabled, playSound, showNotification]);

  // Timer logic
  useEffect(() => {
    // Apply mobile-specific timing adjustments if needed
    const timeInterval = isMobile ? 1100 : 1000; // Slightly longer interval on mobile to compensate for background throttling
    
    let interval: NodeJS.Timeout | null = null
    
    if (timerState.isActive) {
      interval = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeLeft <= 1) {
            // Play sound when timer completes
            triggerNotification()
            
            // Switch modes when timer ends
            if (prev.mode === 'work') {
              return {
                ...prev,
                mode: 'break',
                timeLeft: prev.breakDuration,
                isActive: false
              }
            } else {
              return {
                ...prev,
                mode: 'work',
                timeLeft: prev.workDuration,
                isActive: false,
                completedCycles: prev.completedCycles + 1
              }
            }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 }
        })
      }, timeInterval)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerState.isActive, triggerNotification, isMobile])

  // Reset the timer to the beginning of the current mode
  const resetTimer = () => {
    // Initialize audio on user interaction
    initAudio();
    setTimerState(prev => ({
      ...prev,
      timeLeft: prev.mode === 'work' ? prev.workDuration : prev.breakDuration,
      isActive: false
    }))
  }
  
  // Toggle modes between work and break
  const toggleMode = () => {
    // Initialize audio on user interaction
    initAudio();
    setTimerState(prev => ({
      ...prev,
      mode: prev.mode === 'work' ? 'break' : 'work',
      timeLeft: prev.mode === 'work' ? prev.breakDuration : prev.workDuration,
      isActive: false
    }))
  }

  const saveSettings = () => {
    const newWorkDuration = Math.max(1, parseInt(workInput) || 25) * 60
    const newBreakDuration = Math.max(1, parseInt(breakInput) || 5) * 60
    
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

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Only create audio context after user interaction for mobile browsers
  const handleUserInteraction = useCallback(() => {
    initAudio();
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(console.error);
    }
  }, [initAudio]);

  // Add interaction handler to buttons
  const handleStartClick = useCallback(() => {
    handleUserInteraction();
    setTimerState(prev => ({ ...prev, isActive: true }))
  }, [handleUserInteraction])

  const handlePauseClick = useCallback(() => {
    setTimerState(prev => ({ ...prev, isActive: false }))
  }, [])

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
              onClick={handleStartClick}
              onTouchStart={handleUserInteraction}
              aria-label="Start Timer"
            >
              <PlayIcon className="h-6 w-6" />
            </button>
          ) : (
            <button 
              className="control-button pause" 
              onClick={handlePauseClick}
              aria-label="Pause Timer"
            >
              <PauseIcon className="h-6 w-6" />
            </button>
          )}
          
          <button 
            className="control-button reset" 
            onClick={resetTimer}
            onTouchStart={handleUserInteraction}
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
          onTouchStart={handleUserInteraction}
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