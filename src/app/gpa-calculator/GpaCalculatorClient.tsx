'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar/Navbar'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import './gpa-calculator.css'

// Define the grade types and their values
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

// Define possible grades for dropdown
const possibleGrades = ['', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F']

// Interface for course data
interface Course {
  id: number
  name: string
  grade: string
  hours: number
}

// Calculate GPA based on grades and credit hours
function calculateGPA(courses: Course[], prevGPA: number | null, prevCreditHours: number | null) {
  // Convert null or undefined values to 0
  const prevGPAValue = prevGPA || 0
  const prevCreditHoursValue = prevCreditHours || 0
  
  // If no courses, return existing GPA
  if (courses.length === 0) {
    return { 
      semesterGPA: 0, 
      totalGPA: prevGPAValue, 
      semesterPoints: 0, 
      totalPoints: prevGPAValue * prevCreditHoursValue,
      semesterHours: 0,
      totalHours: prevCreditHoursValue
    }
  }

  // Calculate semester stats
  let semesterPoints = 0
  let semesterHours = 0

  courses.forEach(course => {
    if (course.grade && course.hours) {
      const gradePoint = gradeValues[course.grade as keyof typeof gradeValues].points
      
      semesterPoints += gradePoint * course.hours
      semesterHours += course.hours
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

// Get letter grade based on GPA value
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

export default function GpaCalculatorClient() {  
  // State for previous GPA data - using string for input fields
  const [prevCreditHours, setPrevCreditHours] = useState<string>('')
  const [prevGPA, setPrevGPA] = useState<string>('')
  
  // State for courses
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: '[Course 01]', grade: '', hours: 3 },
    { id: 2, name: '[Course 02]', grade: '', hours: 3 },
    { id: 3, name: '[Course 03]', grade: '', hours: 3 },
    { id: 4, name: '[Course 04]', grade: '', hours: 3 },
    { id: 5, name: '[Course 05]', grade: '', hours: 3 },
    { id: 6, name: '[Course 06]', grade: '', hours: 3 },
  ])

  // Convert string inputs to numbers for calculations
  const prevGPANumber = prevGPA.trim() !== '' ? parseFloat(prevGPA) : null
  const prevCreditHoursNumber = prevCreditHours.trim() !== '' ? parseFloat(prevCreditHours) : null
  
  // Calculate current GPA results
  const results = calculateGPA(courses, prevGPANumber, prevCreditHoursNumber)

  // Handle course update
  const updateCourse = (id: number, field: keyof Course, value: string | number) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === id ? { ...course, [field]: value } : course
      )
    )
  }

  // Add new course
  const addCourse = () => {
    const newId = Math.max(0, ...courses.map(c => c.id)) + 1
    setCourses([...courses, { id: newId, name: `[Course ${String(newId).padStart(2, '0')}]`, grade: '', hours: 3 }])
  }

  // Remove course
  const removeCourse = (id: number) => {
    setCourses(prev => prev.filter(course => course.id !== id))
  }

  return (
    <div className="gpa-calculator-container">
      <Navbar />
      
      <main className="gpa-calculator-content">
        <div className="gpa-calculator-header">
          <h1 className="gpa-calculator-title">GPA Calculator</h1>
        </div>

        <div className="gpa-calculator-section">
          {/* Previous GPA Section */}
          <div className="previous-gpa-section">
            <h2 className="section-subtitle">Cumulative GPA</h2>
            <div className="input-group">
              <div className="input-field">
                <label htmlFor="prevHours">Previous Credit Hours</label>
                <input 
                  type="number" 
                  id="prevHours" 
                  min="0" 
                  value={prevCreditHours} 
                  onChange={(e) => setPrevCreditHours(e.target.value)}
                  className="gpa-input"
                  placeholder="Enter hours"
                />
              </div>
              
              <div className="input-field">
                <label htmlFor="prevGPA">Previous GPA</label>
                <input 
                  type="number" 
                  id="prevGPA" 
                  min="0" 
                  max={5} 
                  step="0.01" 
                  value={prevGPA} 
                  onChange={(e) => setPrevGPA(e.target.value)}
                  className="gpa-input"
                  placeholder="Enter GPA"
                />
              </div>
              
              <div className="input-field">
                <label htmlFor="points">Points (100% accuracy)</label>
                <input 
                  type="text" 
                  id="points" 
                  value={prevGPANumber && prevCreditHoursNumber ? (prevGPANumber * prevCreditHoursNumber).toFixed(2) : ''}
                  readOnly 
                  className="gpa-input readonly-input"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="results-section">
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

          {/* Courses Section */}
          <div className="courses-table-section">
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
            
            <div className="courses-table">
              <div className="courses-table-head">
                <div className="course-cell course-name-cell">Course Name</div>
                <div className="course-cell course-grade-cell">Grade</div>
                <div className="course-cell course-hours-cell">Credit Hours</div>
                <div className="course-cell course-gpa-cell">Grade Points</div>
                <div className="course-cell course-points-cell">Points</div>
                <div className="course-cell course-actions-cell">Actions</div>
              </div>
              
              <div className="courses-table-body">
                {courses.map((course) => {
                  const gradePoint = course.grade ? 
                    gradeValues[course.grade as keyof typeof gradeValues]?.points : 0
                  
                  const points = course.grade ? gradePoint * course.hours : 0
                  
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
                          type="number"
                          min="0"
                          value={course.hours}
                          onChange={(e) => updateCourse(course.id, 'hours', Number(e.target.value))}
                          className="course-input hours-input"
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