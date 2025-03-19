'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import './fileUpload.css';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface UserInfo {
  first_name: string;
  last_name: string;
}

interface CourseFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  description: string | null;
  uploaded_at: string;
  user_id: string;
  user_info: UserInfo;
}

interface FilesListProps {
  courseCode: string;
  refreshTrigger: number;
}

const FilesList: React.FC<FilesListProps> = ({ courseCode, refreshTrigger }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {        
        const response = await fetch(`/api/courses/${courseCode}/files`, {
          headers: {
            'x-user-id': user.id,
          },
        });
        
        const responseText = await response.text();
        let data;
        
        try {
          // Try to parse the response as JSON
          data = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`);
        }
        
        if (!response.ok) {
          throw new Error(data.error || `Server responded with status ${response.status}`);
        }
        
        setFiles(data.files || []);
      } catch (error: any) {
        console.error('Error fetching files:', error);
        setError(`Failed to load files: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFiles();
  }, [courseCode, user, refreshTrigger]);

  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/courses/${courseCode}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
      
      // Remove the file from the list
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    } catch (error: any) {
      console.error('Error deleting file:', error);
      alert(`Failed to delete file: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDownload = async (file: CourseFile) => {
    try {
      // First try to fetch with a HEAD request to check if the file is accessible
      const checkResponse = await fetch(file.file_url, { method: 'HEAD' });
      
      if (!checkResponse.ok) {
        alert(`File cannot be accessed (Status: ${checkResponse.status}). Please try again later.`);
        return;
      }
      
      // Directly trigger download using the file URL
      window.open(file.file_url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('zip') || fileType.includes('rar')) return '🗃️';
    if (fileType.includes('text')) return '📋';
    return '📁';
  };

  return (
    <div className="files-list-section">
      <h3 
        className={`section-title collapsible ${isCollapsed ? 'collapsed' : ''}`}
        onClick={toggleCollapse}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggleCollapse()}
        aria-expanded={!isCollapsed}
        aria-controls="course-files-content"
      >
        Course Materials
        <span className="collapse-icon">{isCollapsed ? '▼' : '▲'}</span>
      </h3>
      
      <div 
        id="course-files-content" 
        className={`files-content ${isCollapsed ? 'collapsed' : ''}`}
      >
        {isLoading && (
          <div className="loading-message">Loading files...</div>
        )}

        {error && !isLoading && (
          <div className="error-message">{error}</div>
        )}

        {!isLoading && !error && files.length === 0 && (
          <div className="empty-files-message">
            No files have been uploaded for this course yet.
          </div>
        )}

        {!isLoading && !error && files.length > 0 && (
          <div className="files-list">
            {files.map(file => (
              <div key={file.id} className="file-item">
                <div className="file-icon">{getFileIcon(file.file_type)}</div>
                
                <div className="file-details">
                  <div className="file-name-row">
                    <a 
                      href={file.file_url} 
                      className="file-name"
                      target="_blank" 
                      rel="noopener noreferrer"
                      aria-label={`Download ${file.file_name}`}
                    >
                      {file.file_name}
                    </a>
                    <div className="file-actions">
                      <button 
                        onClick={() => handleDownload(file)}
                        className="download-file-button"
                        aria-label="Download file"
                        type="button"
                      >
                        Download
                      </button>
                      {file.user_id === user?.id && (
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="delete-file-button"
                          aria-label="Delete file"
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {file.description && (
                    <p className="file-description">{file.description}</p>
                  )}
                  
                  <div className="file-meta">
                    <span className="file-size">{formatFileSize(file.file_size)}</span>
                    <span className="file-date">{formatDate(file.uploaded_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesList; 