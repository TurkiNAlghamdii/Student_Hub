'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { 
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface Course {
  course_code: string
  course_name: string
  description: string | null
  department: string | null
  credits: number
  level: string | null
  section: string | null
  created_at: string
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Form state with default values to ensure controlled inputs
  const [formData, setFormData] = useState<{
    course_code: string
    course_name: string
    description: string
    department: string
    credits: string
    level: string
    section: string
  }>({
    course_code: '',
    course_name: '',
    description: '',
    department: '',
    credits: '',
    level: '',
    section: ''
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  // Filter courses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = courses.filter(course => 
      course.course_code.toLowerCase().includes(query) || 
      course.course_name.toLowerCase().includes(query) ||
      (course.description && course.description.toLowerCase().includes(query)) ||
      (course.section && course.section.toLowerCase().includes(query))
    )
    setFilteredCourses(filtered)
  }, [searchQuery, courses])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/courses')
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

      const data = await response.json()
      const fetchedCourses = data.courses || []
      setCourses(fetchedCourses)
      setFilteredCourses(fetchedCourses)
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      const endpoint = editingCourse 
        ? `/api/admin/courses/${editingCourse.course_code}` 
        : '/api/admin/courses'
      
      const method = editingCourse ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${editingCourse ? 'update' : 'create'} course`)
      }
      
      setIsModalOpen(false)
      resetForm()
      await fetchCourses()
    } catch (err) {
      console.error('Error submitting course:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit course')
    }
  }

  const handleDelete = async (courseCode: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseCode}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete course')
      }

      await fetchCourses()
    } catch (err) {
      console.error('Error deleting course:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete course')
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    // Ensure all form fields have string values
    setFormData({
      course_code: course.course_code || '',
      course_name: course.course_name || '',
      description: course.description || '',
      department: course.department || '',
      credits: course.credits?.toString() || '',
      level: course.level || '',
      section: course.section || ''
    })
    setIsModalOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      course_code: '',
      course_name: '',
      description: '',
      department: '',
      credits: '',
      level: '',
      section: ''
    })
    setEditingCourse(null)
  }

  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="dark:bg-gray-900/50 bg-white/80 backdrop-blur-sm rounded-2xl p-6 dark:border-gray-800/50 border-gray-200/70 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white text-gray-800">Course Management</h2>
        <button
          onClick={openAddModal}
          className="px-4 py-2 dark:bg-emerald-500/10 bg-emerald-500/20 dark:text-emerald-400 text-emerald-600 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-2 dark:border-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/30"
        >
          <PlusIcon className="h-5 w-5" />
          Add Course
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 dark:text-gray-400 text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg pl-10 pr-10 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search courses by code, name, or section..."
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XMarkIcon className="h-5 w-5 dark:text-gray-400 text-gray-500 dark:hover:text-white hover:text-gray-800" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm dark:text-gray-400 text-gray-600">
            Found {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} matching &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg dark:border-gray-800/60 border-gray-300/60">
        <table className="w-full">
          <thead>
            <tr className="text-left dark:bg-gray-800/50 bg-gray-200/70 backdrop-blur-sm">
              <th className="px-4 py-3 dark:text-gray-300 text-gray-700 font-medium text-sm">Code</th>
              <th className="px-4 py-3 dark:text-gray-300 text-gray-700 font-medium text-sm">Name</th>
              <th className="px-4 py-3 dark:text-gray-300 text-gray-700 font-medium text-sm">Section</th>
              <th className="px-4 py-3 dark:text-gray-300 text-gray-700 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800/50 divide-gray-300/50">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <tr key={course.course_code} className="dark:hover:bg-gray-800/30 hover:bg-gray-200/50 transition-colors">
                  <td className="px-4 py-4 font-mono font-medium dark:text-emerald-500 text-emerald-600">{course.course_code}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="dark:text-white text-gray-800">{course.course_name}</span>
                      <span className="text-sm dark:text-gray-400 text-gray-600">{course.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 dark:text-gray-300 text-gray-700">{course.section}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.course_code)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center dark:text-gray-400 text-gray-600">
                  {searchQuery ? (
                    <div>
                      <div>No courses found matching your search.</div>
                      <button 
                        onClick={clearSearch}
                        className="mt-2 dark:text-emerald-400 text-emerald-600 dark:hover:text-emerald-300 hover:text-emerald-500 underline"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div>No courses available.</div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-20 overflow-y-auto">
          <div className="dark:bg-gray-900 bg-white rounded-xl dark:border-gray-800 border-gray-200 p-6 w-full max-w-md mx-auto my-8 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-white text-gray-800">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="dark:text-gray-400 text-gray-500 dark:hover:text-white hover:text-gray-800"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="course_code" className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    id="course_code"
                    name="course_code"
                    value={formData.course_code}
                    onChange={handleInputChange}
                    className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. CS101"
                    required
                    disabled={!!editingCourse}
                  />
                </div>
                
                <div>
                  <label htmlFor="course_name" className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    id="course_name"
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleInputChange}
                    className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Introduction to Computer Science"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Course description..."
                  />
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Computer Science"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="credits" className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">
                    Credits
                  </label>
                  <input
                    type="text"
                    id="credits"
                    name="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="3"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="level" className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">
                    Level
                  </label>
                  <input
                    type="text"
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Undergraduate"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="section" className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="A1"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 dark:text-white text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors mt-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <CheckIcon className="h-4 w-4" />
                  {editingCourse ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 