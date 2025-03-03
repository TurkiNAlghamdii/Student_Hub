import { useRouter } from 'next/navigation'

interface Course {
  course_code: string
  course_name: string
  faculty: {
    name: string
  }
}

interface SearchResultsProps {
  results: Course[]
  onResultClick: () => void
  isVisible: boolean
}

export default function SearchResults({ results, onResultClick, isVisible }: SearchResultsProps) {
  const router = useRouter()

  if (!isVisible) {
    return null
  }

  const handleResultClick = (courseCode: string) => {
    router.push(`/courses/${courseCode}`)
    onResultClick()
  }

  return (
    <div className="search-results-container">
      <div className="search-results">
        {results.length > 0 ? (
          results.map((course) => (
            <div 
              key={course.course_code}
              className="search-result-item"
              onClick={() => handleResultClick(course.course_code)}
            >
              <div className="search-result-code">{course.course_code}</div>
              <div className="search-result-details">
                <div className="search-result-name">{course.course_name}</div>
                <div className="search-result-faculty">{course.faculty?.name}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="search-result-empty">
            No courses found
          </div>
        )}
      </div>
    </div>
  )
} 