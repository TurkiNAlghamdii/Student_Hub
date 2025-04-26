/**
 * TrainingInstitutionsTable Component
 *
 * This component displays a comprehensive table of training institutions where students
 * can apply for summer training programs. It includes search functionality, filtering,
 * and the ability to add new institutions to the database.
 *
 * Key features:
 * - Fetches and displays institution data from Supabase database
 * - Provides real-time search filtering by name, category, or city
 * - Animated UI elements using Framer Motion for enhanced user experience
 * - Integrated form for adding new institutions
 * - Responsive design with appropriate loading and error states
 * - Theme-aware styling that adapts to light/dark mode
 */

'use client'

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { BuildingOfficeIcon, MapPinIcon, LinkIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import AddInstitutionForm from './AddInstitutionForm';

/**
 * Interface for a training institution record
 * @property id - Unique identifier for the institution
 * @property name - Name of the institution
 * @property category - Category/industry of the institution (e.g., Technology, Software)
 * @property city - Location of the institution
 * @property application_link - URL to the institution's application page
 * @property notes - Additional information about the institution
 * @property twitter - Twitter handle of the institution (without the @ symbol)
 */
interface TrainingInstitution {
  id: number;
  name: string;
  category: string;
  city: string;
  application_link: string;
  notes: string;
  twitter: string;
}

/**
 * TrainingInstitutionsTable component implementation
 * 
 * @returns React component displaying a table of training institutions with search and add functionality
 */
const TrainingInstitutionsTable: React.FC = () => {
  // State for storing all institutions from the database
  const [institutions, setInstitutions] = useState<TrainingInstitution[]>([]);
  
  // State for storing filtered institutions based on search query
  const [filteredInstitutions, setFilteredInstitutions] = useState<TrainingInstitution[]>([]);
  
  // Loading and error states for handling data fetching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State to control the visibility of the add institution form
  const [showAddForm, setShowAddForm] = useState(false);
  
  // State for the search query input
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetches training institutions data from Supabase
   * 
   * This function retrieves all institution records, orders them by name,
   * and updates both the full and filtered institution lists.
   * It also handles any errors that might occur during the fetch operation.
   */
  const fetchInstitutions = async () => {
    try {
      // Query the training_institutions table and order by name
      const { data, error } = await supabase
        .from('training_institutions')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Update both the full list and filtered list with fetched data
      setInstitutions(data || []);
      setFilteredInstitutions(data || []);
    } catch (err) {
      // Handle and display any errors that occur
      setError(err instanceof Error ? err.message : 'An error occurred while fetching institutions');
    } finally {
      // Set loading to false regardless of success or failure
      setLoading(false);
    }
  };

  /**
   * Effect to fetch institutions when the component mounts
   * Runs only once on initial render
   */
  useEffect(() => {
    fetchInstitutions();
  }, []);

  /**
   * Effect to filter institutions based on search query
   * Runs whenever the search query or institutions list changes
   * Performs case-insensitive filtering on name, category, and city fields
   */
  useEffect(() => {
    const filtered = institutions.filter(institution => {
      const searchLower = searchQuery.toLowerCase();
      return (
        institution.name.toLowerCase().includes(searchLower) ||
        institution.category.toLowerCase().includes(searchLower) ||
        institution.city.toLowerCase().includes(searchLower)
      );
    });
    setFilteredInstitutions(filtered);
  }, [searchQuery, institutions]);

  /**
   * Handler for successful institution addition
   * Hides the add form and refreshes the institution list
   */
  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchInstitutions();
  };

  /**
   * Conditional rendering for loading and error states
   * Shows a centered loading spinner while data is being fetched
   * Displays an error message if the fetch operation fails
   * Both states use theme-aware text colors
   */
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark:text-red-400 text-red-500 text-center p-4">
        Error: {error}
      </div>
    );
  }

  /**
   * Main component render
   */
  return (
    <div className="space-y-6">
      {/* Header section with title and add button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-gray-800 mb-2">Training Institutions</h2>
          <p className="dark:text-gray-400 text-gray-600">Find and apply to approved training institutions for your summer training program</p>
        </div>
        {/* Add institution button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Institution
        </button>
      </div>

      {/* Search input with icon */}
      <div className="relative">
        {/* Magnifying glass icon positioned inside the input */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 dark:text-gray-400 text-gray-500" />
        </div>
        {/* Search input with theme-aware styling */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, category, or city..."
          className="block w-full pl-10 pr-3 py-2 dark:border-gray-700 border-gray-300 rounded-md leading-5 dark:bg-gray-800 bg-white dark:text-white text-gray-800 dark:placeholder-gray-400 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Conditionally render the add institution form with animation */}
      {showAddForm && (
        <motion.div
          // Animation settings for a smooth entrance and exit
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          {/* Form component with success and cancel handlers */}
          <AddInstitutionForm 
            onSuccess={handleAddSuccess} 
            onCancel={() => setShowAddForm(false)} 
          />
        </motion.div>
      )}

      {/* Table container with horizontal scrolling for small screens */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y dark:divide-gray-700/50 divide-gray-200/50">
          {/* Table header with theme-aware styling */}
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Institution
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Links
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          {/* Table body with animated rows and theme-aware styling */}
          <tbody className="divide-y dark:divide-gray-700/50 divide-gray-200/50">
            {/* Map through filtered institutions and create animated rows */}
            {filteredInstitutions.map((institution) => (
              <motion.tr
                key={institution.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="dark:hover:bg-gray-800/50 hover:bg-gray-100/70 transition-colors duration-200"
              >
                {/* Institution name column with icon */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-2">
                        <BuildingOfficeIcon className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium dark:text-white text-gray-800">{institution.name}</div>
                    </div>
                  </div>
                </td>
                {/* Category column with document icon */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-emerald-400 mr-2" />
                    <span className="text-sm dark:text-gray-300 text-gray-600">{institution.category}</span>
                  </div>
                </td>
                {/* Location column with map pin icon */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-emerald-400 mr-2" />
                    <span className="text-sm dark:text-gray-300 text-gray-600">{institution.city}</span>
                  </div>
                </td>
                {/* Links column with conditional rendering of link icons */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    {/* Application link - only shown if available */}
                    {institution.application_link && (
                      <a
                        href={institution.application_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                        aria-label={`Apply at ${institution.name}`}
                      >
                        <LinkIcon className="h-5 w-5" />
                      </a>
                    )}
                    {/* Twitter link - only shown if available */}
                    {institution.twitter && (
                      <a
                        href={`https://twitter.com/${institution.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                        aria-label={`${institution.name} on Twitter`}
                      >
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </td>
                {/* Notes column with fallback text if empty */}
                <td className="px-6 py-4">
                  <p className="text-sm dark:text-gray-400 text-gray-600">{institution.notes || 'No additional notes'}</p>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainingInstitutionsTable; 