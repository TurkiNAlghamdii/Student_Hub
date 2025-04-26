/**
 * Events Page Component
 * 
 * This client-side component provides a comprehensive events management system that allows:
 * - Viewing upcoming university events in a responsive grid layout
 * - Admin users to create new events with title, description, date, and location
 * - Admin users to delete existing events
 * - Viewing event details including formatted dates and location links
 * 
 * The component includes authentication checks, admin role verification,
 * and complete CRUD operations through Supabase API endpoints.
 * 
 * The component respects the application's theme system by using CSS classes
 * that work with both light and dark modes via the root element class.
 * All styling is defined in events.css which uses :root.dark and :root:not(.dark)
 * selectors to ensure proper theming without any flash of incorrect theme.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import { PlusIcon, MapPinIcon, CalendarIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import './events.css'

/**
 * Event Interface
 * 
 * Defines the structure of event data received from the Supabase database.
 * 
 * @property id - Unique identifier for the event
 * @property title - Title of the event
 * @property description - Detailed description of the event
 * @property date - Date and time of the event (ISO string format)
 * @property location - Location of the event (can be a physical location or URL)
 * @property created_at - Timestamp when the event was created
 */
interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  created_at: string
}

/**
 * EventsPage Component
 * 
 * Main component for displaying and managing university events.
 * Provides different functionality based on user role (admin vs. regular user).
 * 
 * @returns Rendered events page with appropriate states for loading, admin tools, and event listings
 */
export default function EventsPage() {
  /**
   * Component State
   * 
   * - router: Next.js router for navigation
   * - user/authLoading: Authentication state from AuthContext
   * - events: Array of events fetched from Supabase
   * - loading: Loading state during data fetching
   * - isAdmin: Flag indicating if current user has admin privileges
   * - showAddModal: Controls visibility of event creation modal
   * - showDeleteModal: Controls visibility of event deletion confirmation modal
   * - eventToDelete: ID of event selected for deletion
   * - deletingEvent: Loading state during event deletion
   * - formData: Form state for creating new events
   * - submitting: Loading state during event creation
   * - error: Error message for form validation or API errors
   * - showAdminTools: Controls visibility of admin debugging tools
   */
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdminTools, setShowAdminTools] = useState(false)

  /**
   * Authentication, Admin Check, and Events Fetch Effect
   * 
   * This effect handles three important tasks:
   * 1. Redirects unauthenticated users to the login page
   * 2. Checks if the current user has admin privileges
   * 3. Fetches all events from the Supabase database
   * 
   * Admin status is determined by checking the user's app_metadata.is_admin value,
   * with multiple checks to handle different potential formats of the value.
   * Events are fetched and sorted by date in ascending order.
   * 
   * This effect runs whenever the user, authentication state, or router changes.
   */
  useEffect(() => {
    const checkAdminAndFetchEvents = async () => {
      if (!user) return

      try {
        // Check if user is admin using the reliable approach
        const isUserAdmin = user.app_metadata?.is_admin === true || 
                           user.app_metadata?.is_admin === 'true' || 
                           String(user.app_metadata?.is_admin).toLowerCase() === 'true';
        
        // Set admin state based on metadata
        setIsAdmin(isUserAdmin);

        // Fetch events
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })

        if (error) {
          console.error('Error fetching events:', error)
        } else {
          setEvents(data || [])
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else {
        checkAdminAndFetchEvents()
      }
    }
  }, [user, authLoading, router])

  /**
   * Form Input Change Handler
   * 
   * Handles changes to form inputs in the event creation modal.
   * Updates the formData state with the new value for the corresponding field.
   * 
   * @param e - Change event from input or textarea element
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  /**
   * Event Creation Form Submit Handler
   * 
   * Handles the submission of the event creation form. The function:
   * 1. Validates that all required fields are filled
   * 2. Submits the new event data to Supabase
   * 3. Refreshes the events list with the newly created event
   * 4. Resets the form and closes the modal on success
   * 5. Handles and displays any errors that occur during the process
   * 
   * This function is only accessible to admin users who can see the
   * event creation button and modal.
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validate form data
    if (!formData.title || !formData.description || !formData.date) {
      setError('Please fill in all required fields')
      setSubmitting(false)
      return
    }

    try {
      // Insert new event
      const { error } = await supabase
        .from('events')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            date: formData.date,
            location: formData.location
          }
        ])

      if (error) throw error

      // Refresh events list
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      if (fetchError) throw fetchError
      
      setEvents(data || [])
      
      // Reset form and close modal
      setFormData({ title: '', description: '', date: '', location: '' })
      setShowAddModal(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add event';
      setError(errorMessage);
      console.error('Error adding event:', err);
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Date Formatting Helper
   * 
   * Formats ISO date strings into a more readable format for display.
   * Uses the browser's Intl.DateTimeFormat API to format the date
   * with year, month, day, hour, and minute.
   * 
   * @param dateString - ISO date string to format
   * @returns Formatted date string (e.g., "January 1, 2025, 12:00 PM")
   */
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString('en-US', options)
  }

  /**
   * URL Validation Helper
   * 
   * Determines if a string is a valid URL by attempting to create
   * a URL object with it. This is used to determine whether to render
   * the location as a clickable link or plain text.
   * 
   * @param str - String to check if it's a valid URL
   * @returns Boolean indicating if the string is a valid URL
   */
  const isUrl = (str: string) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  /**
   * Event Deletion Initiator
   * 
   * Prepares for event deletion by storing the event ID and showing
   * the confirmation modal. This creates a two-step deletion process
   * to prevent accidental deletions.
   * 
   * @param eventId - ID of the event to be deleted
   */
  const initiateDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
    setShowDeleteModal(true);
  }

  /**
   * Event Deletion Handler
   * 
   * Handles the actual deletion of an event after confirmation.
   * The function:
   * 1. Deletes the event from the Supabase database
   * 2. Updates the local state to remove the deleted event
   * 3. Closes the confirmation modal
   * 4. Handles and displays any errors that occur during deletion
   * 
   * This function is only accessible to admin users who can see the
   * delete button on event cards.
   */
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    setDeletingEvent(true);
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventToDelete);
        
      if (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event: ' + error.message);
        return;
      }
      
      // Update the events list by filtering out the deleted event
      setEvents(events.filter(event => event.id !== eventToDelete));
      
      // Reset and close modal
      setEventToDelete(null);
      setShowDeleteModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while deleting the event.';
      console.error('Unexpected error deleting event:', err);
      alert(errorMessage);
    } finally {
      setDeletingEvent(false);
    }
  }

  /**
   * Deletion Cancellation Handler
   * 
   * Cancels the event deletion process by clearing the eventToDelete state
   * and closing the confirmation modal without making any changes.
   */
  const cancelDelete = () => {
    setEventToDelete(null);
    setShowDeleteModal(false);
  }

  /**
   * Loading State Rendering
   * 
   * Shows a loading spinner while authentication is being verified
   * or events data is being fetched. This provides visual feedback
   * to users during data loading operations.
   * 
   * The LoadingSpinner component is designed to work with the application's
   * theme system, displaying appropriately in both light and dark modes.
   */
  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  /**
   * Main Component Render
   * 
   * Renders the complete events page with multiple sections:
   * - Events listing in a responsive grid
   * - Add event button (admin only)
   * - Event creation modal (admin only)
   * - Event deletion confirmation modal (admin only)
   * - Hidden admin tools toggle
   * 
   * The UI is designed to be responsive and uses theme-compatible styling
   * that works in both light and dark modes through CSS classes defined in events.css.
   * The styling uses :root.dark and :root:not(.dark) selectors to ensure proper theming
   * without any flash of incorrect theme during page load or navigation.
   */
  return (
    <div className="events-container">
      <Navbar />
      <div className="events-content">
        <div className="events-section">
          <div className="events-header">
            <h1 className="events-title">University Events</h1>
            <div>
              {/* Admin tools - hidden by default */}
              {showAdminTools && (
                <div className="admin-tools">
                  <p className="text-xs text-gray-400 mb-2">Admin Status: {isAdmin ? 'Enabled' : 'Disabled'}</p>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      
                      try {
                        // This requires service role or admin rights
                        const { error } = await supabase.rpc('set_user_admin', {
                          email_to_update: user.email,
                          admin_value: true
                        });
                        
                        if (error) {
                          console.error('Error setting admin:', error);
                          alert('Error: ' + error.message);
                        } else {
                          alert('Admin status updated! Please refresh the page.');
                        }
                      } catch (err) {
                        console.error('Error setting admin:', err);
                        alert('Unexpected error updating admin status');
                      }
                    }}
                    className="text-xs px-2 py-1 bg-purple-600 text-white rounded mr-2"
                  >
                    Grant Admin
                  </button>
                  <button
                    onClick={() => setIsAdmin(true)}
                    className="text-xs px-2 py-1 bg-emerald-600 text-white rounded"
                  >
                    Force Admin UI
                  </button>
                </div>
              )}
              
              {/* Add Event button - visible to admins */}
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="add-button"
                  aria-label="Add new event"
                >
                  <PlusIcon className="add-button-icon" />
                  <span>Add Event</span>
                </button>
              )}
            </div>
          </div>

          {/* Events grid */}
          {events.length === 0 ? (
            <div className="empty-events">
              <p>No events scheduled at the moment.</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-card-content">
                    <div className="event-card-header">
                      <h3 className="event-card-title">{event.title}</h3>
                      {isAdmin && (
                        <button
                          onClick={() => initiateDeleteEvent(event.id)}
                          className="delete-button"
                          aria-label="Delete event"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <p className="event-card-description">{event.description}</p>
                    
                    <div className="event-card-detail">
                      <CalendarIcon className="event-card-icon" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="event-card-detail">
                        <MapPinIcon className="event-card-icon" />
                        {isUrl(event.location) ? (
                          <a 
                            href={event.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="event-card-link"
                          >
                            View Location
                          </a>
                        ) : (
                          <span>{event.location}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2 className="modal-title mb-6">Add New Event</h2>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group">
                <label htmlFor="title" className="form-label">Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter event title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description*</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-input"
                  placeholder="Enter event description"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="date" className="form-label">Date and Time*</label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location" className="form-label">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter location or URL"
                />
              </div>
              
              <div className="modal-footer mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cancel-button"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="add-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Create Event</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <ExclamationTriangleIcon className="modal-warning-icon" />
              <h2 className="modal-title">Delete Event</h2>
            </div>
            
            <p className="modal-message">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            
            <div className="modal-footer">
              <button
                onClick={cancelDelete}
                className="cancel-button"
                disabled={deletingEvent}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                className="delete-confirm-button"
                disabled={deletingEvent}
              >
                {deletingEvent ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Event</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden admin toggle button */}
      <button 
        onClick={() => setShowAdminTools(!showAdminTools)} 
        className="opacity-0 hover:opacity-100 fixed bottom-4 right-4 text-xs dark:text-gray-700 text-gray-500 dark:bg-gray-900/30 bg-gray-200/50 p-2 rounded-full"
      >
        Admin
      </button>
    </div>
  )
}