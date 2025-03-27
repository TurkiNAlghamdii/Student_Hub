'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowUpTrayIcon, 
  DocumentIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import './fileUpload.css';

interface FileUploadSectionProps {
  courseCode: string;
  onUploadSuccess: () => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ 
  courseCode, 
  onUploadSuccess 
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  // Simulate upload progress
  useEffect(() => {
    if (isUploading) {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 90 ? 90 : newProgress; // Cap at 90% for actual upload completion
        });
      }, 400);
      
      return () => clearInterval(interval);
    } else if (uploadProgress !== 0 && uploadProgress !== 100) {
      // Reset or complete progress when upload finishes
      setUploadProgress(uploadStatus?.isError ? 0 : 100);
    }
  }, [isUploading, uploadStatus]);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setFile(acceptedFiles[0]);
    setUploadStatus(null);
    setUploadProgress(0);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
    }
  });

  // Show file rejection errors if any
  useEffect(() => {
    if (fileRejections.length > 0) {
      const { errors } = fileRejections[0];
      if (errors.length > 0) {
        const errorMessage = errors[0].message;
        setUploadStatus({
          message: errorMessage,
          isError: true,
        });
      }
    }
  }, [fileRejections]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const clearForm = () => {
    setFile(null);
    setDescription('');
    setUploadStatus(null);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!user) {
      setUploadStatus({
        message: 'You must be logged in to upload files',
        isError: true,
      });
      return;
    }

    if (!file) {
      setUploadStatus({
        message: 'Please select a file to upload',
        isError: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch(`/api/courses/${courseCode}/files`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus({
          message: 'File uploaded successfully!',
          isError: false,
        });
        setUploadProgress(100);
        setTimeout(() => {
          clearForm();
          onUploadSuccess();
        }, 1500);
      } else {
        setUploadStatus({
          message: data.error || 'Failed to upload file',
          isError: true,
        });
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus({
        message: 'An error occurred while uploading the file',
        isError: true,
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
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

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <DocumentIcon className="file-type-icon pdf" />;
      case 'doc':
      case 'docx':
        return <DocumentIcon className="file-type-icon doc" />;
      case 'xls':
      case 'xlsx':
        return <DocumentIcon className="file-type-icon xls" />;
      case 'ppt':
      case 'pptx':
        return <DocumentIcon className="file-type-icon ppt" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <DocumentIcon className="file-type-icon img" />;
      case 'zip':
      case 'rar':
        return <DocumentIcon className="file-type-icon zip" />;
      default:
        return <DocumentIcon className="file-type-icon" />;
    }
  };

  return (
    <div className="modern-file-upload">
      <div className="upload-container">
        <div
          {...getRootProps()}
          className={`dropzone-modern ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
          tabIndex={0}
          aria-label="File upload dropzone"
        >
          <input {...getInputProps()} aria-label="File input" />
          
          {file ? (
            <div className="selected-file-modern">
              <div className="file-preview-modern">
                {getFileTypeIcon(file.name)}
                <div className="file-details-modern">
                  <div className="file-name-modern">{file.name}</div>
                  <div className="file-size-modern">{formatFileSize(file.size)}</div>
                </div>
              </div>
              <button 
                className="remove-file-button-modern"
                onClick={(e) => {
                  e.stopPropagation();
                  clearForm();
                }}
                type="button"
                aria-label="Remove selected file"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="dropzone-content-modern">
              <div className="upload-icon-modern">
                <ArrowUpTrayIcon className="h-10 w-10" />
              </div>
              <p className="dropzone-text-modern">
                {isDragActive
                  ? 'Drop your file here...'
                  : 'Drag and drop your file here, or click to browse'}
              </p>
              <p className="dropzone-hint-modern">
                PDF, Word, Excel, PowerPoint, Images, ZIP (Max: 10MB)
              </p>
            </div>
          )}
        </div>
        
        <div className="form-group-modern">
          <label htmlFor="file-description" className="form-label-modern">
            Description (optional)
          </label>
          <textarea
            id="file-description"
            className="description-input-modern"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Describe what this file contains to help others understand its purpose..."
            rows={3}
            aria-label="File description"
          />
        </div>
        
        {uploadStatus && (
          <div className={`status-message-modern ${uploadStatus.isError ? 'error' : 'success'}`}>
            {uploadStatus.isError ? (
              <ExclamationCircleIcon className="status-icon h-5 w-5" />
            ) : (
              <CheckCircleIcon className="status-icon h-5 w-5" />
            )}
            <p className="status-text">{uploadStatus.message}</p>
          </div>
        )}
        
        {uploadProgress > 0 && (
          <div className="upload-progress-container">
            <div 
              className="upload-progress-bar" 
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
            <span className="upload-progress-text">{Math.round(uploadProgress)}%</span>
          </div>
        )}
        
        <div className="upload-actions-modern">
          <button
            onClick={clearForm}
            className="cancel-button-modern"
            disabled={(!file && !description) || isUploading}
            type="button"
            aria-label="Cancel upload"
          >
            Cancel
          </button>
          
          <button
            onClick={handleUpload}
            className={`upload-button-modern ${isUploading ? 'loading' : ''}`}
            disabled={isUploading || !file}
            type="button"
            aria-label="Upload file"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
            {!isUploading && <ArrowUpTrayIcon className="action-icon h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadSection; 