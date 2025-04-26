/**
 * AddInstitutionForm Component
 *
 * This component provides a form for adding new training institutions to the database.
 * It handles form state, validation, submission to Supabase, and provides appropriate
 * feedback to the user throughout the process.
 *
 * Key features:
 * - Form validation for required fields
 * - Real-time error handling and display
 * - Loading state management during submission
 * - Theme-aware styling that adapts to dark mode
 * - Clean UI with appropriate spacing and field grouping
 */

'use client'

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * Props interface for the AddInstitutionForm component
 * @property onSuccess - Callback function to execute when form submission succeeds
 * @property onCancel - Callback function to execute when the user cancels the form
 */
interface AddInstitutionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * AddInstitutionForm component implementation
 * 
 * @param props - Component props
 * @param props.onSuccess - Function to call when form submission succeeds
 * @param props.onCancel - Function to call when form is canceled
 * @returns React component with a form for adding training institutions
 */
const AddInstitutionForm: React.FC<AddInstitutionFormProps> = ({ onSuccess, onCancel }) => {
  // State for form field values
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    city: '',
    application_link: '',
    notes: '',
    twitter: ''
  });
  
  // Loading state for form submission
  const [loading, setLoading] = useState(false);
  
  // Error state for displaying submission errors
  const [error, setError] = useState<string | null>(null);

  /**
   * Generic change handler for all form inputs
   * Uses the input's name attribute to update the corresponding property in formData
   * 
   * @param e - Change event from input, textarea, or select element
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Form submission handler
   * Prevents default form submission, sets loading state,
   * and attempts to insert the new institution into Supabase
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Clear any previous errors

    try {
      // Insert the form data into the training_institutions table
      const { error } = await supabase
        .from('training_institutions')
        .insert([formData]);

      if (error) throw error;
      
      // Call the success callback to notify parent component
      onSuccess();
    } catch (err) {
      // Handle and display any errors that occur
      setError(err instanceof Error ? err.message : 'An error occurred while adding the institution');
    } finally {
      // Reset loading state regardless of outcome
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Form header with title and close button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Add New Training Institution</h3>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close form"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Error message display - only shown when an error occurs */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Main form with grid layout (1 column on mobile, 2 columns on larger screens) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Institution name field (required) */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Institution Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Enter institution name"
            />
          </div>

          {/* Category dropdown field (required) */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Select a category</option>
              <option value="Technology">Technology</option>
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
              <option value="Networking">Networking</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Data Science">Data Science</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* City field (required) */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Enter city"
            />
          </div>

          {/* Application link field (optional) - URL input type for validation */}
          <div>
            <label htmlFor="application_link" className="block text-sm font-medium text-gray-300 mb-1">
              Application Link
            </label>
            <input
              type="url"
              id="application_link"
              name="application_link"
              value={formData.application_link}
              onChange={handleChange}
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="https://example.com/apply"
            />
          </div>

          {/* Twitter handle field (optional) - with @ symbol prefix */}
          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-1">
              Twitter Handle
            </label>
            <div className="relative">
              {/* @ symbol positioned inside the input */}
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">@</span>
              <input
                type="text"
                id="twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-md pl-7 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="username"
              />
            </div>
          </div>
        </div>

        {/* Notes textarea field (optional) - spans full width */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="Additional information about the institution"
          />
        </div>

        {/* Form action buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          {/* Cancel button */}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          {/* Submit button with loading state */}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors flex items-center"
          >
            {loading ? (
              <span className="flex items-center">
                {/* SVG loading spinner - only shown during form submission */}
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
            ) : (
              <span className="flex items-center">
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Institution
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddInstitutionForm; 