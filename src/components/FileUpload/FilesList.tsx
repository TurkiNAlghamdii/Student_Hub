'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  DocumentIcon, 
  DocumentTextIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  PresentationChartBarIcon,
  StarIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import './filesList.css';


interface UserInfo {
  full_name: string;
  avatar_url?: string;
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

type SortOption = 'newest' | 'oldest' | 'name' | 'size' | 'type';
type ViewMode = 'list' | 'grid';
type FilterType = 'all' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'archive' | 'starred';

const FilesList: React.FC<FilesListProps> = ({ courseCode, refreshTrigger }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const isUserAdmin = user.app_metadata?.is_admin === true || 
                         user.app_metadata?.is_admin === 'true' || 
                         String(user.app_metadata?.is_admin).toLowerCase() === 'true';
      setIsAdmin(isUserAdmin);
    }
  }, [user]);

  // Function to fetch favorites from the server
  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/students/${user.id}/starred-materials`, {
        method: 'HEAD',
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (!response.ok) {
        return;
      }
      
      const starredFilesHeader = response.headers.get('X-Starred-Files');
      if (starredFilesHeader) {
        try {
          const starredFileIds = JSON.parse(starredFilesHeader);
          setFavorites(starredFileIds);
        } catch (e) {
          // Silently handle parsing errors
        }
      }
    } catch (error) {
      // Silently handle network errors
    }
  };

  // Replace localStorage favorites with API calls
  useEffect(() => {
    // Skip if no user is logged in
    if (!user) return;
    
    fetchFavorites();
  }, [user, refreshTrigger]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setShowSkeletons(true);
      
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
        
        // Simulate longer loading for skeleton effect (only in development)
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            setFiles(data.files || []);
            setShowSkeletons(false);
          }, 1000);
        } else {
        setFiles(data.files || []);
          setShowSkeletons(false);
        }
      } catch (error: any) {
        setError(`Failed to load files: ${error.message || 'Unknown error'}`);
        setShowSkeletons(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFiles();
  }, [courseCode, user, refreshTrigger]);

  // Toggle favorite with API call
  const toggleFavorite = async (fileId: string) => {
    if (!user) {
      alert('Please log in to star materials');
      return;
    }
    
    // Set the file ID that's currently being toggled
    setIsTogglingFavorite(fileId);
    
    // Track previous state for rollback if needed
    const wasStarred = favorites.includes(fileId);
    
    // Optimistic update
    setFavorites(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
    
    try {
      const response = await fetch(`/api/students/${user.id}/starred-materials/${fileId}`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.status === 401 || response.status === 403) {
        // Authentication or authorization issue
        setFavorites(prev => wasStarred ? [...prev, fileId] : prev.filter(id => id !== fileId));
        alert('You are not authorized to star/unstar this material. Please log in again.');
        return;
      }
      
      let responseData;
      try {
        const responseText = await response.text();
        
        if (responseText) {
          responseData = JSON.parse(responseText);
        }
      } catch (e) {
        responseData = { error: 'Failed to parse response' };
      }
      
      if (!response.ok) {
        // Revert the optimistic update if the request fails
        setFavorites(prev => wasStarred ? [...prev, fileId] : prev.filter(id => id !== fileId));
        
        // Alert with more details for debugging
        if (process.env.NODE_ENV === 'development') {
          alert(`Error: ${responseData?.error || 'Unknown error'}\nDetails: ${responseData?.details || 'No details'}\nCode: ${responseData?.code || 'No code'}`);
        } else {
          alert('Failed to update star status. Please try again later.');
        }
      } else {
        // Refresh favorites from the server to ensure consistency
        fetchFavorites();
      }
    } catch (error: any) {
      // Revert the optimistic update if there's an error
      setFavorites(prev => wasStarred ? [...prev, fileId] : prev.filter(id => id !== fileId));
      
      alert(`Network error: ${error.message || 'Failed to connect to server'}`);
    } finally {
      setIsTogglingFavorite(null);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      setIsDeleting(fileId);
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
      
      // Also remove from favorites if needed
      if (favorites.includes(fileId)) {
        setFavorites(prev => prev.filter(id => id !== fileId));
      }
    } catch (error: any) {
      alert(`Failed to delete file: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = async (file: CourseFile) => {
    try {
      setIsDownloading(file.id);
      // First try to fetch with a HEAD request to check if the file is accessible
      const checkResponse = await fetch(file.file_url, { method: 'HEAD' });
      
      if (!checkResponse.ok) {
        alert(`File cannot be accessed (Status: ${checkResponse.status}). Please try again later.`);
        return;
      }
      
      // Directly trigger download using the file URL
      window.open(file.file_url, '_blank');
    } catch (error) {
      alert('Error downloading file. Please try again.');
    } finally {
      setIsDownloading(null);
    }
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  const getFileTypeInfo = (fileType: string, fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileType.includes('pdf') || extension === 'pdf') {
      return { 
        icon: <DocumentIcon className="file-type-icon pdf" />,
        category: 'document',
        label: 'PDF'
      };
    } else if (fileType.includes('word') || fileType.includes('document') || ['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return { 
        icon: <DocumentTextIcon className="file-type-icon doc" />,
        category: 'document',
        label: 'Document'
      };
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return { 
        icon: <ChartBarIcon className="file-type-icon xls" />,
        category: 'spreadsheet',
        label: 'Spreadsheet'
      };
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation') || ['ppt', 'pptx'].includes(extension || '')) {
      return { 
        icon: <PresentationChartBarIcon className="file-type-icon ppt" />,
        category: 'presentation',
        label: 'Presentation'
      };
    } else if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension || '')) {
      return { 
        icon: <PhotoIcon className="file-type-icon img" />,
        category: 'image',
        label: 'Image'
      };
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return { 
        icon: <ArchiveBoxIcon className="file-type-icon zip" />,
        category: 'archive',
        label: 'Archive'
      };
    } else {
      return { 
        icon: <DocumentIcon className="file-type-icon" />,
        category: 'other',
        label: 'File'
      };
    }
  };

  const isNewFile = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays < 2; // Less than 2 days old
  };

  // Function to sort and filter files
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(file => 
        file.file_name.toLowerCase().includes(query) ||
        (file.description && file.description.toLowerCase().includes(query))
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'starred') {
        // Filter to show only starred files
        result = result.filter(file => favorites.includes(file.id));
      } else {
        // Filter by file type category
        result = result.filter(file => {
          const { category } = getFileTypeInfo(file.file_type, file.file_name);
          return category === filterType;
        });
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      // Favorites always come first if not already filtered by starred
      if (filterType !== 'starred') {
        if (favorites.includes(a.id) && !favorites.includes(b.id)) return -1;
        if (!favorites.includes(a.id) && favorites.includes(b.id)) return 1;
      }
      
      switch (sortBy) {
        case 'newest':
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
        case 'oldest':
          return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
        case 'name':
          return a.file_name.localeCompare(b.file_name);
        case 'size':
          return b.file_size - a.file_size;
        case 'type':
          const typeA = getFileTypeInfo(a.file_type, a.file_name).category;
          const typeB = getFileTypeInfo(b.file_type, b.file_name).category;
          return typeA.localeCompare(typeB);
        default:
          return 0;
      }
    });
    
    return result;
  }, [files, searchQuery, sortBy, filterType, favorites]);

  // Generate skeleton placeholders for loading state
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className={`file-skeleton ${viewMode === 'grid' ? 'grid-view' : ''}`}>
        <div className="file-skeleton-icon"></div>
        <div className="file-skeleton-content">
          <div className="file-skeleton-name"></div>
          <div className="file-skeleton-description"></div>
          <div className="file-skeleton-meta"></div>
        </div>
      </div>
    ));
  };

  const renderEmpty = () => (
    <div className="files-empty-state">
      <div className="empty-icon">
        <DocumentIcon className="h-16 w-16" />
      </div>
      <h3 className="empty-title">No Files Found</h3>
      <p className="empty-description">
        {searchQuery || filterType !== 'all' 
          ? "Try adjusting your search or filters to find what you're looking for."
          : 'No materials have been uploaded for this course yet.'}
      </p>
    </div>
  );

  const toggleSortMenu = () => {
    setShowSortMenu(!showSortMenu);
    if (showFilterMenu) setShowFilterMenu(false);
  };

  const toggleFilterMenu = () => {
    setShowFilterMenu(!showFilterMenu);
    if (showSortMenu) setShowSortMenu(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <div className="enhanced-files-list">
      <div className="files-header" onClick={toggleCollapse}>
        <div className="files-header-content">
          <h2 className="files-title">Course Materials</h2>
          {files.length > 0 && (
            <span className="files-count">{files.length} {files.length === 1 ? 'file' : 'files'}</span>
          )}
        </div>
        <button 
          className="collapse-toggle" 
          aria-label={isCollapsed ? "Expand files section" : "Collapse files section"}
        aria-expanded={!isCollapsed}
        >
          {isCollapsed 
            ? <ChevronDownIcon className="h-5 w-5" /> 
            : <ChevronUpIcon className="h-5 w-5" />}
        </button>
      </div>

      <div className={`files-collapsible-content ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="files-toolbar">
          <div className="search-container">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="toolbar-actions">
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} 
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} 
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M4 4h7v7H4V4zM13 4h7v7h-7V4zM4 13h7v7H4v-7zM13 13h7v7h-7v-7z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
            
            <div className="toolbar-dropdown sort-dropdown">
              <button 
                className="toolbar-btn" 
                onClick={toggleSortMenu}
                aria-label="Sort options"
                aria-expanded={showSortMenu}
              >
                <ArrowsUpDownIcon className="h-5 w-5" />
                <span className="btn-text">Sort</span>
              </button>
              
              {showSortMenu && (
                <div className="dropdown-menu">
                  <button 
                    className={`dropdown-item ${sortBy === 'newest' ? 'active' : ''}`}
                    onClick={() => { setSortBy('newest'); setShowSortMenu(false); }}
                  >
                    Newest First
                  </button>
                  <button 
                    className={`dropdown-item ${sortBy === 'oldest' ? 'active' : ''}`}
                    onClick={() => { setSortBy('oldest'); setShowSortMenu(false); }}
                  >
                    Oldest First
                  </button>
                  <button 
                    className={`dropdown-item ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => { setSortBy('name'); setShowSortMenu(false); }}
                  >
                    Name
                  </button>
                  <button 
                    className={`dropdown-item ${sortBy === 'size' ? 'active' : ''}`}
                    onClick={() => { setSortBy('size'); setShowSortMenu(false); }}
                  >
                    Size
                  </button>
                  <button 
                    className={`dropdown-item ${sortBy === 'type' ? 'active' : ''}`}
                    onClick={() => { setSortBy('type'); setShowSortMenu(false); }}
                  >
                    File Type
                  </button>
                </div>
              )}
            </div>
            
            <div className="toolbar-dropdown filter-dropdown">
              <button 
                className="toolbar-btn" 
                onClick={toggleFilterMenu}
                aria-label="Filter options"
                aria-expanded={showFilterMenu}
              >
                <FunnelIcon className="h-5 w-5" />
                <span className="btn-text">Filter</span>
              </button>
              
              {showFilterMenu && (
                <div className="dropdown-menu">
                  <button 
                    className={`dropdown-item ${filterType === 'all' ? 'active' : ''}`}
                    onClick={() => { setFilterType('all'); setShowFilterMenu(false); }}
                  >
                    All Files
                  </button>
                  <button 
                    className={`dropdown-item ${filterType === 'document' ? 'active' : ''}`}
                    onClick={() => { setFilterType('document'); setShowFilterMenu(false); }}
                  >
                    Documents
                  </button>
                  <button 
                    className={`dropdown-item ${filterType === 'spreadsheet' ? 'active' : ''}`}
                    onClick={() => { setFilterType('spreadsheet'); setShowFilterMenu(false); }}
                  >
                    Spreadsheets
                  </button>
                  <button 
                    className={`dropdown-item ${filterType === 'presentation' ? 'active' : ''}`}
                    onClick={() => { setFilterType('presentation'); setShowFilterMenu(false); }}
                  >
                    Presentations
                  </button>
                  <button 
                    className={`dropdown-item ${filterType === 'image' ? 'active' : ''}`}
                    onClick={() => { setFilterType('image'); setShowFilterMenu(false); }}
                  >
                    Images
                  </button>
                  <button 
                    className={`dropdown-item ${filterType === 'starred' ? 'active' : ''}`}
                    onClick={() => { setFilterType('starred'); setShowFilterMenu(false); }}
                  >
                    Starred
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="files-results-info">
          {filteredAndSortedFiles.length > 0 && (
            <span>
              Showing {filteredAndSortedFiles.length} {filteredAndSortedFiles.length === 1 ? 'file' : 'files'}
              {searchQuery && ` matching "${searchQuery}"`}
              {filterType === 'starred' ? ' (starred files)' : filterType !== 'all' && ` (${filterType} files)`}
            </span>
          )}
        </div>

        {isLoading && showSkeletons ? (
          <div className={`files-grid ${viewMode}`}>
            {renderSkeletons()}
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredAndSortedFiles.length === 0 ? (
          renderEmpty()
        ) : (
          <div className={`files-grid ${viewMode}`}>
            {filteredAndSortedFiles.map(file => {
              const fileTypeInfo = getFileTypeInfo(file.file_type, file.file_name);
              const isNew = isNewFile(file.uploaded_at);
              const isFavorite = favorites.includes(file.id);
              
              return (
                <div 
                  key={file.id} 
                  className={`file-item ${viewMode === 'grid' ? 'grid-view' : ''} ${isFavorite ? 'favorite' : ''}`}
                >
                  <div className="file-icon-column">
                    {fileTypeInfo.icon}
                    {isNew && <span className="new-badge">New</span>}
                  </div>
                  
                  <div className="file-details-column">
                    <div className="file-header">
                    <a 
                      href={file.file_url} 
                      className="file-name"
                      target="_blank" 
                      rel="noopener noreferrer"
                      aria-label={`Download ${file.file_name}`}
                    >
                      {file.file_name}
                    </a>
                      <span className="file-type-badge">{fileTypeInfo.label}</span>
                    </div>
                    
                    {file.description && (
                      <p className="file-description">{file.description}</p>
                    )}
                    
                    <div className="file-meta">
                      <span className="file-size-info">
                        <DocumentArrowDownIcon className="meta-icon h-4 w-4" />
                        <span>{formatFileSize(file.file_size)}</span>
                      </span>
                      <span className="file-date">
                        <ClockIcon className="meta-icon h-4 w-4" />
                        <span title={formatDate(file.uploaded_at)}>{getTimeAgo(file.uploaded_at)}</span>
                      </span>
                      <span className="file-uploader-info">
                        <UserCircleIcon className="h-4 w-4 text-blue-400" />
                        <span title={file.user_info?.full_name || 'Unknown User'}>
                          {file.user_info?.full_name || 'Unknown User'}
                        </span>
                      </span>
                      
                      {viewMode === 'grid' && (
                    <div className="file-actions">
                          <button
                            onClick={() => toggleFavorite(file.id)}
                            className={`action-btn favorite-btn ${isFavorite ? 'active' : ''} ${isTogglingFavorite === file.id ? 'loading' : ''}`}
                            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                            disabled={isTogglingFavorite === file.id}
                          >
                            {isFavorite ? (
                              <StarIconSolid className="h-5 w-5 text-yellow-400" />
                            ) : (
                              <StarIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          
                          <div className="file-action-group">
                            <button 
                              onClick={() => handleDownload(file)}
                              className="action-btn download-btn"
                              aria-label="Download file"
                              title="Download"
                              disabled={isDownloading === file.id}
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            
                            {(file.user_id === user?.id || isAdmin) && (
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="action-btn delete-btn"
                                aria-label="Delete file"
                                title="Delete"
                                disabled={isDeleting === file.id}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {viewMode !== 'grid' && (
                    <div className="file-actions-column">
                      <button
                        onClick={() => toggleFavorite(file.id)}
                        className={`action-btn favorite-btn ${isFavorite ? 'active' : ''} ${isTogglingFavorite === file.id ? 'loading' : ''}`}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        disabled={isTogglingFavorite === file.id}
                      >
                        {isFavorite ? (
                          <StarIconSolid className="h-5 w-5 text-yellow-400" />
                        ) : (
                          <StarIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      
                      <button 
                        onClick={() => handleDownload(file)}
                        className="action-btn download-btn"
                        aria-label="Download file"
                        title="Download"
                        disabled={isDownloading === file.id}
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      
                      {(file.user_id === user?.id || isAdmin) && (
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="action-btn delete-btn"
                          aria-label="Delete file"
                          title="Delete"
                          disabled={isDeleting === file.id}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesList; 