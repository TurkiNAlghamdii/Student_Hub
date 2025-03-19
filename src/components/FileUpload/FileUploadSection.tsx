'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
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
  const [uploadStatus, setUploadStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setFile(acceptedFiles[0]);
    setUploadStatus(null);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
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

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const clearForm = () => {
    setFile(null);
    setDescription('');
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
        clearForm();
        onUploadSuccess();
      } else {
        setUploadStatus({
          message: data.error || 'Failed to upload file',
          isError: true,
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus({
        message: 'An error occurred while uploading the file',
        isError: true,
      });
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

  return (
    <div className="file-upload-section">
      <h3 className="section-title">Upload Course Material</h3>
      
      <div className="upload-container">
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
          tabIndex={0}
          aria-label="File upload dropzone"
        >
          <input {...getInputProps()} aria-label="File input" />
          
          {file ? (
            <div className="selected-file">
              <div className="file-preview">
                <div className="file-icon">📄</div>
                <div className="file-details">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatFileSize(file.size)}</div>
                </div>
              </div>
              <button 
                className="remove-file-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                type="button"
                aria-label="Remove selected file"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="upload-icon">📁</div>
              <p className="dropzone-text">
                {isDragActive
                  ? 'Drop the file here'
                  : 'Drag and drop a file here, or click to select'}
              </p>
              <p className="dropzone-hint">
                Supported file types: PDF, Word, Excel, PPT, TXT, images, ZIP, RAR<br />
                Max file size: 10MB
              </p>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="file-description" className="form-label">
            Description (optional)
          </label>
          <textarea
            id="file-description"
            className="description-input"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Add a description for the file"
            rows={3}
            aria-label="File description"
          />
        </div>
        
        {uploadStatus && (
          <div className="status-message-container">
            <p className={`status-message ${uploadStatus.isError ? 'error' : 'success'}`}>
              {uploadStatus.message}
            </p>
          </div>
        )}
        
        <div className="upload-actions">
          <button
            onClick={clearForm}
            className="cancel-button"
            disabled={!file && !description}
            type="button"
            aria-label="Cancel upload"
          >
            Cancel
          </button>
          
          <button
            onClick={handleUpload}
            className={`upload-button ${isUploading ? 'loading' : ''}`}
            disabled={isUploading || !file}
            type="button"
            aria-label="Upload file"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadSection; 