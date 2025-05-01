/**
 * Course Management Component
 * 
 * This client-side component provides an administrative interface for managing
 * courses in the Student Hub application. It allows administrators to create,
 * edit, and delete courses, as well as add rich text descriptions using Markdown.
 * 
 * Key features:
 * - Course listing with search functionality
 * - Create and edit courses with rich text formatting
 * - Markdown editor with formatting toolbar
 * - Color selection for course styling
 * - Responsive design for various screen sizes
 * 
 * The component integrates with the application's theme system through consistent
 * styling that adapts to the dark theme used in the admin interface, ensuring
 * a cohesive visual experience across the admin dashboard.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

/**
 * Course Interface
 * 
 * Defines the structure of a course object retrieved from the database.
 * This interface ensures type safety when working with course data throughout
 * the management interface.
 * 
 * @property course_code - Unique identifier for the course (e.g., 'CS101')
 * @property course_name - Full name of the course
 * @property description - Optional Markdown-formatted description of the course
 * @property Instractions - Optional instructions for the course (note: typo in property name is preserved for database compatibility)
 * @property section - Optional section identifier for the course
 * @property created_at - Timestamp when the course was created
 */
interface Course {
  course_code: string
  course_name: string
  description: string | null
  Instractions: string | null
  section: string | null
  created_at: string
}

/**
 * Color Option Interface
 * 
 * Defines the structure of a color option for course styling.
 * This interface is used to create a consistent set of color choices
 * for administrators to select from when creating or editing courses.
 * 
 * @property name - Human-readable name of the color (e.g., 'Red')
 * @property value - CSS hex color value (e.g., '#ef4444')
 */
interface ColorOption {
  name: string;
  value: string;
}

/**
 * Color Options Array
 * 
 * Predefined set of color options for course styling.
 * These colors are used in the color picker when creating or editing courses,
 * providing a consistent color palette that works well with the application's
 * theme system in both light and dark modes.
 * 
 * The colors are based on the Tailwind CSS color palette for consistency
 * with the rest of the application's styling.
 */
const colorOptions: ColorOption[] = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'White', value: '#ffffff' },
];

/**
 * Markdown Text Formatting Utilities
 * 
 * These helper functions provide rich text formatting capabilities for the
 * Markdown editor, allowing administrators to easily add formatting to course
 * descriptions without needing to know Markdown syntax.
 */

/**
 * Insert Markdown Formatting
 * 
 * Inserts Markdown formatting tags around selected text in a textarea,
 * or inserts default text if no text is selected. This function handles
 * the cursor position and selection state to provide a seamless editing experience.
 * 
 * @param textArea - The textarea element to modify
 * @param beforeText - Text to insert before the selection (e.g., '**' for bold)
 * @param afterText - Text to insert after the selection (e.g., '**' for bold)
 * @param defaultText - Default text to insert if no text is selected
 */
const insertMarkdown = (
  textArea: HTMLTextAreaElement,
  beforeText: string,
  afterText: string = "",
  defaultText: string = ""
) => {
  const start = textArea.selectionStart;
  const end = textArea.selectionEnd;
  const selectedText = textArea.value.substring(start, end);
  const textToInsert = selectedText || defaultText;
  
  const newText = 
    textArea.value.substring(0, start) + 
    beforeText + 
    textToInsert + 
    afterText + 
    textArea.value.substring(end);
  
  return {
    newText,
    selectionStart: start + beforeText.length,
    selectionEnd: start + beforeText.length + textToInsert.length
  };
};

// Add a custom implementation for ReactMarkdown span component
const MarkdownSpan = (props: {
  node?: {
    properties?: {
      style?: string;
    };
  };
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) => {
  // Extract style from props if it exists
  const style = props.node?.properties?.style;
  
  if (style && typeof style === 'string') {
    // Extract color if present
    if (style.includes('color:')) {
      const colorMatch = style.match(/color:\s*([^;]+)/);
      if (colorMatch && colorMatch[1]) {
        return <span style={{ color: colorMatch[1] }} {...props} />;
      }
    }
  }
  
  // Default rendering
  return <span {...props} />;
};

// Add custom components for ReactMarkdown
const MarkdownComponents = {
  span: MarkdownSpan,
  font: ({ node, ...props }: {
    node?: {
      properties?: {
        color?: string;
      };
    };
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLSpanElement>) => {
    // Extract color attribute
    const color = node?.properties?.color;
    
    if (color) {
      return <span style={{ color }} {...props} />;
    }
    
    // Default rendering
    return <span {...props} />;
  }
};

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBrowser, setIsBrowser] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Form state with default values to ensure controlled inputs
  const [formData, setFormData] = useState<{
    course_code: string
    course_name: string
    description: string
    Instractions: string
    department: string
    credits: string
    level: string
    section: string
  }>({
    course_code: '',
    course_name: '',
    description: '',
    Instractions: '',
    department: '',
    credits: '',
    level: '',
    section: ''
  })

  // Add a ref for the instructions textarea
  const instructionsTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // State for Markdown editor
  const [previewMode, setPreviewMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Set isBrowser to true after component mounts (for portal rendering)
  useEffect(() => {
    setIsBrowser(true)
  }, []);

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
      
      // Only include fields that exist in the database
      const finalFormData = {
        course_code: formData.course_code,
        course_name: formData.course_name,
        description: formData.description,
        Instractions: formData.Instractions,
        section: formData.section || ''
      }
      
      // When updating, the API will preserve existing values for fields not explicitly changed
      console.log('Submitting form data:', finalFormData, 'Editing course?', !!editingCourse)
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData)
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
    console.log('Editing course with data:', course)
    console.log('Instractions field:', course.Instractions)
    
    setEditingCourse(course)
    // Ensure all form fields have string values and preserve existing data
    setFormData({
      course_code: course.course_code || '',
      course_name: course.course_name || '',
      description: course.description || '',
      Instractions: course.Instractions || '', // Important: preserve existing instructions
      department: '', // Keep for UI but not sent to database
      credits: '3', // Keep for UI but not sent to database
      level: '', // Keep for UI but not sent to database
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
      Instractions: '',
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

  // Modify the handleMarkdownFormat function for color
  const handleMarkdownFormat = (format: string, colorValue?: string) => {
    const textarea = instructionsTextareaRef.current;
    if (!textarea) return;
    
    let formatOptions = {
      newText: "",
      selectionStart: 0,
      selectionEnd: 0
    };
    
    switch (format) {
      case 'h1':
        formatOptions = insertMarkdown(textarea, "# ", "", "Heading 1");
        break;
      case 'h2':
        formatOptions = insertMarkdown(textarea, "## ", "", "Heading 2");
        break;
      case 'h3':
        formatOptions = insertMarkdown(textarea, "### ", "", "Heading 3");
        break;
      case 'bold':
        formatOptions = insertMarkdown(textarea, "**", "**", "Bold text");
        break;
      case 'italic':
        formatOptions = insertMarkdown(textarea, "_", "_", "Italic text");
        break;
      case 'ul':
        formatOptions = insertMarkdown(textarea, "- ", "", "List item");
        break;
      case 'ol':
        formatOptions = insertMarkdown(textarea, "1. ", "", "List item");
        break;
      case 'link':
        formatOptions = insertMarkdown(textarea, "[", "](url)", "Link text");
        break;
      case 'code':
        formatOptions = insertMarkdown(textarea, "```\n", "\n```", "Code block");
        break;
      case 'color':
        if (colorValue) {
          // Use a simpler HTML format that ReactMarkdown can handle better
          formatOptions = insertMarkdown(
            textarea, 
            `<font color="${colorValue}">`, 
            "</font>", 
            "Colored text"
          );
        }
        break;
      case 'hr':
        formatOptions = insertMarkdown(textarea, "\n---\n", "", "");
        break;
      case 'quote':
        formatOptions = insertMarkdown(textarea, "> ", "", "Blockquote");
        break;
      case 'highlight':
        formatOptions = insertMarkdown(textarea, '<mark>', '</mark>', 'Highlighted text');
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      Instractions: formatOptions.newText
    }));
    
    // Set the cursor position after the update
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(
          formatOptions.selectionStart,
          formatOptions.selectionEnd
        );
      }
    }, 0);
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  // Toggle color picker
  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker);
  };

  // Apply color to text
  const applyColor = (colorValue: string) => {
    handleMarkdownFormat('color', colorValue);
    setShowColorPicker(false);
  };

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

      {/* Course Modal - Using createPortal to render outside the container */}
      {isBrowser && isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100] pt-20 overflow-y-auto">
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
                    rows={4}
                    className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Detailed description of the course"
                  />
                </div>
                
                {/* Instractions Input */}
                <div> 
                  <label htmlFor="Instractions" className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Instractions</label>
                  
                  {/* Enhanced Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 mb-2 p-1 dark:bg-gray-800/50 bg-gray-200/70 rounded-md dark:border-gray-700 border-gray-300">
                    <div className="flex gap-1 mr-2">
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('h1')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-300"
                        title="Heading 1"
                      >
                        H1
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('h2')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-300"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('h3')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-300"
                        title="Heading 3"
                      >
                        H3
                      </button>
                    </div>
                    
                    <div className="flex gap-1 mr-2">
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('bold')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 bg-gray-300 hover:dark:bg-gray-600 hover:bg-gray-400 dark:text-gray-300 text-gray-700 font-bold"
                        title="Bold"
                      >
                        B
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('italic')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 bg-gray-300 hover:dark:bg-gray-600 hover:bg-gray-400 dark:text-gray-300 text-gray-700 italic"
                        title="Italic"
                      >
                        I
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('highlight')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 bg-gray-300 hover:dark:bg-gray-600 hover:bg-gray-400 dark:text-gray-300 text-gray-700"
                        title="Highlight"
                      >
                        <span className="bg-yellow-300 text-black px-1">H</span>
                      </button>
                    </div>
                    
                    <div className="flex gap-1 mr-2">
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('ul')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 bg-gray-300 hover:dark:bg-gray-600 hover:bg-gray-400 dark:text-gray-300 text-gray-700"
                        title="Bulleted List"
                      >
                        • List
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('ol')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 bg-gray-300 hover:dark:bg-gray-600 hover:bg-gray-400 dark:text-gray-300 text-gray-700"
                        title="Numbered List"
                      >
                        1. List
                      </button>
                    </div>
                    
                    <div className="flex gap-1 mr-2">
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('link')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-300"
                        title="Link"
                      >
                        🔗 Link
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('code')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 bg-gray-300 hover:dark:bg-gray-600 hover:bg-gray-400 dark:text-gray-300 text-gray-700 font-mono"
                        title="Code Block"
                      >
                        {`<>`} Code
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('quote')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-300"
                        title="Block Quote"
                      >
                        &quot; Quote
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMarkdownFormat('hr')}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 hover:dark:bg-gray-600 text-gray-300"
                        title="Horizontal Rule"
                      >
                        — HR
                      </button>
                    </div>
                    
                    <div className="relative flex gap-1 mr-2">
                      <button 
                        type="button" 
                        onClick={toggleColorPicker}
                        className="px-2 py-1 text-xs rounded dark:bg-gray-700 bg-gray-300 hover:dark:bg-gray-600 hover:bg-gray-400 dark:text-gray-300 text-gray-700 flex items-center"
                        title="Text Color"
                      >
                        <span className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 mr-1"></span>
                          Color
                        </span>
                      </button>
                      
                      {showColorPicker && (
                        <div className="absolute z-10 top-full left-0 mt-1 p-2 dark:bg-gray-800 bg-white rounded-md dark:border-gray-700 border-gray-300 shadow-lg">
                          <div className="grid grid-cols-3 gap-1">
                            {colorOptions.map(color => (
                              <button
                                key={color.value}
                                onClick={() => applyColor(color.value)}
                                className="w-6 h-6 rounded-full border border-gray-600 hover:border-white transition-colors"
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-auto">
                      <button 
                        type="button" 
                        onClick={togglePreviewMode}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          previewMode 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                            : 'dark:bg-gray-700 bg-gray-300 hover:dark:bg-gray-600 hover:bg-gray-400 dark:text-gray-300 text-gray-700'
                        }`}
                        title="Toggle Preview"
                      >
                        {previewMode ? "Edit" : "Preview"}
                      </button>
                    </div>
                  </div>
                  
                  {/* Editor / Preview Toggle */}
                  <div className="min-h-[200px] relative">
                    {!previewMode ? (
                      <textarea
                        id="Instractions"
                        name="Instractions"
                        ref={instructionsTextareaRef}
                        value={formData.Instractions}
                        onChange={handleInputChange}
                        rows={8}
                        className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                        placeholder="Enter course instructions (Markdown and HTML supported)"
                      />
                    ) : (
                      <div className="w-full min-h-[200px] max-h-[400px] overflow-y-auto dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg px-3 py-2 dark:text-white text-gray-800">
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:my-2 prose-p:my-1 prose-li:my-0.5 prose-hr:my-4">
                          <ReactMarkdown 
                            rehypePlugins={[rehypeRaw]}
                            components={MarkdownComponents}
                          >
                            {formData.Instractions}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="mt-1 text-xs text-gray-500">
                    Markdown and basic HTML formatting are supported. Toggle preview to see how your content will appear.
                  </p>
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
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>{editingCourse ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}