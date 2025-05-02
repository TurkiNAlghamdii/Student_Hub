/**
 * GPA Calculator Client Component
 * 
 * This client-side component provides a comprehensive GPA calculation tool that allows students to:
 * - Calculate their semester GPA based on current courses and grades
 * - Calculate their cumulative GPA by including previous GPA and credit hours
 * - Add, edit, and remove courses dynamically
 * - View detailed grade points and quality points for each course
 * 
 * The calculator follows King Abdulaziz University's 5-point GPA system and provides
 * accurate calculations with proper rounding and grade letter determination.
 * 
 * The component respects the application's theme system by using CSS classes
 * that work with both light and dark modes via the root element class.
 * All styling is defined in gpa-calculator.css which uses :root.dark and :root:not(.dark)
 * selectors to ensure proper theming without any flash of incorrect theme.
 */

'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar/Navbar'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import './gpa-calculator.css'

/**
 * Grade Point Values
 * 
 * Defines the grade types and their corresponding point values according to
 * King Abdulaziz University's 5-point GPA system.
 * 
 * Each grade has a specific point value that is used in GPA calculations:
 * - A+ = 5.00 (Excellent)
 * - A  = 4.75 (Excellent)
 * - B+ = 4.50 (Very Good)
 * - B  = 4.00 (Very Good)
 * - C+ = 3.50 (Good)
 * - C  = 3.00 (Good)
 * - D+ = 2.50 (Pass)
 * - D  = 2.00 (Pass)
 * - F  = 1.00 (Fail)
 */
const gradeValues = {
  'A+': { points: 5.00 },
  'A': { points: 4.75 },
  'B+': { points: 4.50 },
  'B': { points: 4.00 },
  'C+': { points: 3.50 },
  'C': { points: 3.00 },
  'D+': { points: 2.50 },
  'D': { points: 2.00 },
  'F': { points: 1.00 },
}

/**
 * Possible Grades Array
 * 
 * Defines the list of possible grades for the dropdown selection in the course table.
 * The empty string represents the default 'Select grade' option.
 * 
 * The grades are ordered from highest to lowest for intuitive selection in the dropdown menu.
 */
const possibleGrades = ['', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F']

/**
 * Course Interface
 * 
 * Defines the structure of course data used in the GPA calculator.
 * 
 * @property id - Unique identifier for the course
 * @property name - Name or title of the course
 * @property grade - Letter grade received in the course (A+, A, B+, etc.)
 * @property hours - Credit hours for the course (typically 1-6)
 */
interface Course {
  id: number
  name: string
  grade: string
  hours: string
}

/**
 * GPA Calculation Function
 * 
 * Calculates both semester and cumulative GPA based on current courses and previous academic record.
 * The function handles both new students (no previous GPA) and continuing students.
 * 
 * The calculation follows these steps:
 * 1. Handle null/undefined values for previous GPA and credit hours
 * 2. Return appropriate values if no courses are provided
 * 3. Calculate semester points and hours based on current courses
 * 4. Calculate semester GPA by dividing semester points by semester hours
 * 5. Calculate cumulative stats by combining semester stats with previous academic record
 * 
 * @param courses - Array of Course objects containing grade and credit hour information
 * @param prevGPA - Previous cumulative GPA (can be null for new students)
 * @param prevCreditHours - Previous total credit hours completed (can be null for new students)
 * @returns Object containing semester and cumulative GPA statistics
 */
function calculateGPA(courses: Course[], prevPoints: number | null, prevCreditHours: number | null) {
  // Convert null or undefined values to 0
  const prevPointsValue = prevPoints || 0
  const prevCreditHoursValue = prevCreditHours || 0
  
  // Calculate previous GPA if we have credit hours
  const prevGPAValue = prevCreditHoursValue > 0 ? prevPointsValue / prevCreditHoursValue : 0
  
  // If no courses, return existing GPA
  if (courses.length === 0) {
    return { 
      semesterGPA: 0, 
      totalGPA: prevGPAValue, 
      semesterPoints: 0, 
      totalPoints: prevPointsValue,
      semesterHours: 0,
      totalHours: prevCreditHoursValue
    }
  }

  // Calculate semester stats
  let semesterPoints = 0
  let semesterHours = 0

  courses.forEach(course => {
    if (course.grade && course.hours.trim() !== '') {
      const gradePoint = gradeValues[course.grade as keyof typeof gradeValues].points
      const hoursValue = parseFloat(course.hours)
      
      if (!isNaN(hoursValue)) {
        semesterPoints += gradePoint * hoursValue
        semesterHours += hoursValue
      }
    }
  })

  const semesterGPA = semesterHours > 0 ? (semesterPoints / semesterHours) : 0
  
  // Calculate cumulative stats
  const totalPoints = semesterPoints + (prevGPAValue * prevCreditHoursValue)
  const totalHours = semesterHours + prevCreditHoursValue
  const totalGPA = totalHours > 0 ? (totalPoints / totalHours) : 0

  return {
    semesterGPA,
    totalGPA,
    semesterPoints,
    totalPoints,
    semesterHours,
    totalHours
  }
}

/**
 * Letter Grade Determination Function
 * 
 * Converts a numeric GPA value to its corresponding letter grade with description.
 * This follows King Abdulaziz University's grading scale and descriptions.
 * 
 * The function uses a series of threshold checks, starting from the highest possible grade,
 * and returns the appropriate letter grade with its description (Excellent, Very Good, etc.)
 * 
 * @param gpa - Numeric GPA value (typically between 0 and 5)
 * @returns String representation of the letter grade with description
 */
function getLetterGrade(gpa: number): string {
  if (gpa >= 4.75) return 'Excellent (A+)'
  if (gpa >= 4.5) return 'Excellent (A)'
  if (gpa >= 4.0) return 'Very Good (B+)'
  if (gpa >= 3.5) return 'Very Good (B)'
  if (gpa >= 3.0) return 'Good (C+)'
  if (gpa >= 2.5) return 'Good (C)'
  if (gpa >= 2.0) return 'Pass (D+)'
  if (gpa >= 1.0) return 'Pass (D)'
  return 'Fail (F)'
}

/**
 * GPA Calculator Client Component
 * 
 * Main component for the GPA calculator functionality.
 * Manages state for courses, previous GPA data, and handles all user interactions.
 * 
 * @returns Rendered GPA calculator with interactive form elements and real-time calculations
 */
export default function GpaCalculatorClient() {  
  /**
   * Component State
   * 
   * - prevCreditHours: String value for previous credit hours input field
   * - prevGPA: String value for previous GPA input field
   * - courses: Array of Course objects representing the current semester courses
   */
  // State for previous GPA data - using string for input fields
  const [prevCreditHours, setPrevCreditHours] = useState<string>('')
  const [prevGPA, setPrevGPA] = useState<string>('')
  const [prevPoints, setPrevPoints] = useState<string>('')
  const [calculationMode, setCalculationMode] = useState<'gpa' | 'points'>('gpa')
  
  // State for courses
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: '[Course 01]', grade: '', hours: '3' },
    { id: 2, name: '[Course 02]', grade: '', hours: '3' },
    { id: 3, name: '[Course 03]', grade: '', hours: '3' },
    { id: 4, name: '[Course 04]', grade: '', hours: '3' },
    { id: 5, name: '[Course 05]', grade: '', hours: '3' },
    { id: 6, name: '[Course 06]', grade: '', hours: '3' },
  ])

  /**
   * Data Processing
   * 
   * Convert string inputs to numbers for calculations and calculate GPA results.
   * This section handles the conversion of user input strings to numeric values,
   * with appropriate null handling for empty inputs.
   */
  // Convert string inputs to numbers for calculations
  const prevCreditHoursNumber = prevCreditHours.trim() !== '' ? parseFloat(prevCreditHours) : null
  
  // Calculate previous points based on calculation mode
  let prevPointsNumber: number | null = null
  
  if (calculationMode === 'gpa') {
    const prevGPANumber = prevGPA.trim() !== '' ? parseFloat(prevGPA) : null
    prevPointsNumber = (prevGPANumber !== null && prevCreditHoursNumber !== null) 
      ? prevGPANumber * prevCreditHoursNumber 
      : null
  } else { // points mode
    prevPointsNumber = prevPoints.trim() !== '' ? parseFloat(prevPoints) : null
  }
  
  // Calculate current GPA results
  const results = calculateGPA(courses, prevPointsNumber, prevCreditHoursNumber)

  /**
   * Course Update Handler
   * 
   * Updates a specific field of a course in the courses array.
   * Uses the functional form of setState to ensure updates are based on the latest state.
   * 
   * @param id - ID of the course to update
   * @param field - Field name to update (name, grade, or hours)
   * @param value - New value for the specified field
   */
  const updateCourse = (id: number, field: keyof Course, value: string | number) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === id ? { ...course, [field]: value } : course
      )
    )
  }

  /**
   * Add Course Handler
   * 
   * Adds a new course to the courses array with default values.
   * Generates a unique ID by finding the maximum existing ID and adding 1.
   * Sets a default name with zero-padded ID, empty grade, and 3 credit hours.
   */
  const addCourse = () => {
    const newId = Math.max(0, ...courses.map(c => c.id)) + 1
    setCourses([...courses, { id: newId, name: `[Course ${String(newId).padStart(2, '0')}]`, grade: '', hours: '3' }])
  }

  /**
   * Remove Course Handler
   * 
   * Removes a course from the courses array based on its ID.
   * Uses the functional form of setState with filter to create a new array
   * excluding the course with the specified ID.
   * 
   * @param id - ID of the course to remove
   */
  const removeCourse = (id: number) => {
    setCourses(prev => prev.filter(course => course.id !== id))
  }

  /**
   * Main Component Render
   * 
   * Renders the complete GPA calculator with multiple sections:
   * - Header with title
   * - Previous GPA input section
   * - Results section showing semester and cumulative GPA
   * - Courses table for entering course grades and credit hours
   * 
   * The UI is designed to be responsive and uses theme-compatible styling
   * that works in both light and dark modes through CSS classes defined in gpa-calculator.css.
   * The styling uses :root.dark and :root:not(.dark) selectors to ensure proper theming
   * without any flash of incorrect theme during page load or navigation.
   */
  return (
    <div className="gpa-calculator-container">
      <Navbar />
      
      <main className="gpa-calculator-content">
        <div className="gpa-calculator-header">
          <h1 className="gpa-calculator-title">GPA Calculator</h1>
        </div>

        <div className="gpa-calculator-section">
          {/* Previous GPA Section - For entering previous academic record */}
          <div className="previous-gpa-section">
            <h2 className="section-subtitle">Cumulative GPA</h2>
            

            
            <div className="input-group">
              <div className="input-field">
                <label htmlFor="prevHours">Previous Credit Hours</label>
                <input 
                  type="text" 
                  id="prevHours" 
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={prevCreditHours} 
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string or valid numbers
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setPrevCreditHours(value);
                    }
                  }}
                  className="gpa-input"
                  placeholder="Enter hours"
                />
              </div>
              


              <div className="input-field">
                <div className="input-field-header">
                  <label htmlFor="prevGPA">Previous GPA</label>
                  <div className="calculation-toggle">
                    <label className="toggle-label">
                      <input 
                        type="checkbox" 
                        checked={calculationMode === 'points'}
                        onChange={() => setCalculationMode(calculationMode === 'gpa' ? 'points' : 'gpa')}
                        className="toggle-checkbox"
                      />
                      <span className="toggle-text">Use points</span>
                    </label>
                  </div>
                </div>
                <input 
                  type="text" 
                  id="prevGPA" 
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={calculationMode === 'gpa' ? prevGPA : 
                    (prevCreditHoursNumber && prevPointsNumber && prevCreditHoursNumber > 0) ? 
                    (prevPointsNumber / prevCreditHoursNumber).toFixed(2) : ''}
                  onChange={(e) => {
                    if (calculationMode === 'gpa') {
                      const value = e.target.value;
                      // Allow empty string or valid numbers with up to 2 decimal places
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        // Ensure the value doesn't exceed 5
                        const numValue = parseFloat(value);
                        if (value === '' || isNaN(numValue) || numValue <= 5) {
                          setPrevGPA(value);
                        }
                      }
                    }
                  }}
                  readOnly={calculationMode === 'points'}
                  className={`gpa-input ${calculationMode === 'points' ? 'readonly-input' : ''}`}
                  placeholder="Enter GPA (0-5)"
                />
              </div>
              
              <div className="input-field">
                <label htmlFor="points">Points (100% accuracy)</label>
                <input 
                  type="text" 
                  id="points" 
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={calculationMode === 'points' ? prevPoints : 
                    prevGPA.trim() !== '' && prevCreditHours.trim() !== '' ? 
                    (parseFloat(prevGPA) * parseFloat(prevCreditHours)).toFixed(2) : ''}
                  onChange={(e) => {
                    if (calculationMode === 'points') {
                      const value = e.target.value;
                      // Allow empty string or valid numbers with up to 2 decimal places
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        setPrevPoints(value);
                      }
                    }
                  }}
                  readOnly={calculationMode === 'gpa'}
                  className={`gpa-input ${calculationMode === 'gpa' ? 'readonly-input' : ''}`}
                  placeholder="Enter total points"
                />
              </div>
            </div>
          </div>

          {/* Results Section - Displays calculated GPA results */}
          <div className="results-section">
            {/* Cumulative GPA results - Combines previous and current semester */}
            <div className="cumulative-results">
              <h2 className="section-subtitle">Cumulative Results</h2>
              <div className="results-grid">
                <div className="result-item">
                  <span className="result-label">Points (100% accuracy)</span>
                  <span className="result-value">{results.totalPoints.toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Credit Hours</span>
                  <span className="result-value">{results.totalHours}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">GPA</span>
                  <span className="result-value gpa-value">{results.totalGPA.toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Grade</span>
                  <span className="result-value">{getLetterGrade(results.totalGPA)}</span>
                </div>
              </div>
            </div>

            {/* Semester GPA results - Based only on current courses */}
            <div className="semester-results">
              <h2 className="section-subtitle">Semester Results</h2>
              <div className="results-grid">
                <div className="result-item">
                  <span className="result-label">Points (100% accuracy)</span>
                  <span className="result-value">{results.semesterPoints.toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Credit Hours</span>
                  <span className="result-value">{results.semesterHours}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">GPA</span>
                  <span className="result-value gpa-value">{results.semesterGPA.toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Grade</span>
                  <span className="result-value">{getLetterGrade(results.semesterGPA)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Section - Interactive table for managing courses */}
          <div className="courses-table-section">
            {/* Table header with title and add course button */}
            <div className="courses-table-header">
              <h2 className="section-subtitle">Course Grades</h2>
              <button 
                onClick={addCourse}
                className="add-course-button"
                aria-label="Add course"
                tabIndex={0}
              >
                <PlusIcon className="w-5 h-5" />
                Add Course
              </button>
            </div>
            
            {/* Courses table with column headers and course rows */}
            <div className="courses-table">
              {/* Table column headers */}
              <div className="courses-table-head">
                <div className="course-cell course-name-cell">Course Name</div>
                <div className="course-cell course-grade-cell">Grade</div>
                <div className="course-cell course-hours-cell">Credit Hours</div>
                <div className="course-cell course-gpa-cell">Grade Points</div>
                <div className="course-cell course-points-cell">Points</div>
                <div className="course-cell course-actions-cell">Actions</div>
              </div>
              
              {/* Table body with course rows */}
              <div className="courses-table-body">
                {courses.map((course) => {
                  const gradePoint = course.grade ? 
                    gradeValues[course.grade as keyof typeof gradeValues]?.points : 0
                  
                  const hoursValue = course.hours.trim() !== '' ? parseFloat(course.hours) : 0
                  const points = (course.grade && !isNaN(hoursValue)) ? gradePoint * hoursValue : 0
                  
                  return (
                    <div className="course-row" key={course.id}>
                      <div className="course-cell course-name-cell">
                        <input
                          type="text"
                          value={course.name}
                          onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                          className="course-input name-input"
                        />
                      </div>
                      <div className="course-cell course-grade-cell">
                        <select
                          value={course.grade}
                          onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                          className="course-input grade-select"
                        >
                          {possibleGrades.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade || 'Select grade'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="course-cell course-hours-cell">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*"
                          value={course.hours}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string or valid numbers
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              updateCourse(course.id, 'hours', value);
                            }
                          }}
                          className="course-input hours-input"
                          placeholder="0"
                        />
                      </div>
                      <div className="course-cell course-gpa-cell">
                        <span className="readonly-value">
                          {course.grade ? gradePoint : '-'}
                        </span>
                      </div>
                      <div className="course-cell course-points-cell">
                        <span className="readonly-value">
                          {course.grade ? points.toFixed(2) : '-'}
                        </span>
                      </div>
                      <div className="course-cell course-actions-cell">
                        <button
                          onClick={() => removeCourse(course.id)}
                          className="remove-course-btn"
                          aria-label="Remove course"
                          tabIndex={0}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 