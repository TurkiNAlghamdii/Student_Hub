/**
 * RSS Simple Component
 * 
 * This client-side component fetches and displays RSS feed content, specifically optimized
 * for displaying X (formerly Twitter) posts. It provides a clean, responsive interface for
 * displaying the latest updates from an X feed with proper theme integration.
 * 
 * Key features:
 * - Fetches RSS feed data from a specified URL via API
 * - Displays posts with images, text content, and publication dates
 * - Identifies and labels retweets vs. original posts
 * - Adapts to both light and dark themes using the application's theme system
 * - Provides loading, error, and empty states with appropriate feedback
 * 
 * The component integrates with the application's theme system through both CSS modules
 * and inline styles that adapt to the current theme. It uses a combination of class-based
 * and inline styling to ensure proper theme application without flashing during navigation.
 */

'use client'

import { useEffect, useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import TwitterXIcon from '../icons/TwitterXIcon'
import styles from './RssSimple.module.css'
import Image from 'next/image'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * Media Item Interface
 * 
 * Defines the structure of media items attached to RSS feed entries.
 * 
 * @property url - URL of the media item (image, video, etc.)
 * @property type - MIME type of the media (e.g., 'image/jpeg', 'video/mp4')
 * @property width - Optional width of the media in pixels
 * @property height - Optional height of the media in pixels
 * @property length - Optional length/duration for time-based media (in seconds)
 */
interface MediaItem {
  url: string
  type: string
  width?: number
  height?: number
  length?: number
}

/**
 * Feed Item Interface
 * 
 * Defines the structure of individual items within an RSS feed.
 * 
 * @property title - Title of the feed item (post/tweet)
 * @property link - URL to the original post
 * @property description - Text description or content of the post
 * @property pubDate - Publication date as a string
 * @property content - Full content of the post, may include HTML
 * @property media - Array of media items attached to the post
 */
interface FeedItem {
  title: string
  link: string
  description: string
  pubDate: string
  content: string
  media: MediaItem[]
}

/**
 * Feed Data Interface
 * 
 * Defines the overall structure of an RSS feed.
 * 
 * @property title - Title of the feed (e.g., "FCIT KAU X Feed")
 * @property description - Description of the feed
 * @property link - URL to the feed source
 * @property items - Array of feed items (posts/tweets)
 */
interface FeedData {
  title: string
  description: string
  link: string
  items: FeedItem[]
}

/**
 * RSS Simple Props Interface
 * 
 * Defines the props accepted by the RssSimple component.
 * 
 * @property url - URL of the RSS feed to fetch
 * @property title - Optional custom title for the widget (defaults to "Latest Updates")
 * @property count - Optional number of items to display (defaults to 3)
 */
interface RssSimpleProps {
  url: string
  title?: string
  count?: number
}

/**
 * RSS Simple Component
 * 
 * Fetches and displays RSS feed content from X (Twitter), with theme integration.
 * The component handles loading states, errors, and empty feeds gracefully.
 * 
 * It uses both CSS modules for styling and inline styles for theme-specific adjustments
 * to ensure proper theme integration and prevent theme flashing during navigation.
 * 
 * @param url - URL of the RSS feed to fetch
 * @param title - Title for the widget (defaults to "Latest Updates")
 * @param count - Number of items to display (defaults to 3)
 * @returns React component for displaying the RSS feed
 */
const RssSimple = ({ url, title = "Latest Updates", count = 3 }: RssSimpleProps) => {
  // State for storing feed data and handling loading/error states
  const [feedData, setFeedData] = useState<FeedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isViewMoreHovered, setIsViewMoreHovered] = useState(false)
  // Get current theme from context
  const { theme } = useTheme()

  /**
   * Dynamic Theme Styles
   * 
   * Creates inline styles based on the current theme to ensure proper
   * theme integration. This approach is used alongside CSS modules to
   * provide complete theme coverage and prevent theme flashing.
   * 
   * For dark mode, uses semi-transparent dark backgrounds with appropriate
   * contrast for text and borders.
   */
  const darkModeStyles = theme === 'dark' ? {
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderColor: 'rgba(55, 65, 81, 0.5)',
    color: '#f9fafb'
  } : {}

  /**
   * Theme Integration Effect
   * 
   * Ensures the RSS component properly integrates with the application's theme system
   * by adding or removing a global class based on the current theme.
   * 
   * This approach helps override any default RSS styling that might not respect
   * the theme context and ensures consistent appearance across theme changes.
   * The cleanup function removes the class when the component unmounts to prevent
   * side effects.
   */
  useEffect(() => {
    const rssContainer = document.querySelector(`.${styles.container}`);
    if (rssContainer) {
      if (theme === 'dark') {
        document.documentElement.classList.add('force-dark-rss');
      } else {
        document.documentElement.classList.remove('force-dark-rss');
      }
    }

    // Clean up when component unmounts
    return () => {
      document.documentElement.classList.remove('force-dark-rss');
    };
  }, [theme])

  /**
   * Fetch RSS Feed Data
   * 
   * Fetches the RSS feed data from the provided URL via the application's API.
   * The API endpoint handles the actual RSS parsing and returns structured data.
   * 
   * This effect runs when the component mounts and whenever the URL changes.
   * It manages loading states and error handling to provide appropriate feedback
   * to users in all scenarios.
   */
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true)
        // Encode the URL to ensure it's safe for use in a query parameter
        const encodedUrl = encodeURIComponent(url)
        const response = await fetch(`/api/rss?url=${encodedUrl}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch feed: ${response.status}`)
        }

        const data = await response.json()
        setFeedData(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching RSS feed:', err)
        setError('Failed to load feed. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
  }, [url])

  /**
   * Format Date for Display
   * 
   * Converts a date string from the RSS feed into a human-readable format.
   * Uses locale-specific formatting to display the month, day, and year.
   * Includes error handling to return the original string if parsing fails.
   * 
   * @param {string} dateString - The date string to format
   * @returns {string} Formatted date string (e.g., "Apr 26, 2025")
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return ''

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return dateString
    }
  }

  /**
   * Get Image URL from Feed Item
   * 
   * Extracts the most appropriate image URL from a feed item using multiple strategies:
   * 1. First checks for media attachments with image MIME types
   * 2. Falls back to extracting image URLs from HTML content or description
   * 
   * This function ensures we can display images from RSS feeds even when they're
   * structured differently or don't explicitly provide media attachments.
   * 
   * @param {FeedItem} item - The feed item to extract an image from
   * @returns {string|null} URL of the image, or null if no image is found
   */
  const getImageUrl = (item: FeedItem): string | null => {
    // First check if we have media content from our API
    if (item.media && item.media.length > 0) {
      // Filter for image types
      const imageMedia = item.media.filter(m =>
        m.type.startsWith('image/') || m.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      )

      if (imageMedia.length > 0) {
        return imageMedia[0].url
      }
    }

    // Fallback: extract from content or description
    return extractImageFromContent(item.content, item.description)
  }

  /**
   * Extract Image URL from HTML Content
   * 
   * Uses regular expressions to find image URLs within HTML content or description.
   * This is a fallback method when explicit media attachments aren't available.
   * 
   * The function first checks the content field, then falls back to the description
   * field, extracting the src attribute from the first img tag found.
   * 
   * @param {string} content - HTML content that might contain image tags
   * @param {string} description - HTML description that might contain image tags
   * @returns {string|null} URL of the first image found, or null if no image is found
   */
  const extractImageFromContent = (content: string, description: string): string | null => {
    // First try to find image in content
    if (content) {
      const imgRegex = /<img[^>]+src="([^"]+)"/i
      const match = content.match(imgRegex)
      if (match && match[1]) {
        return match[1]
      }
    }

    // If no image in content, try description
    if (description) {
      const imgRegex = /<img[^>]+src="([^"]+)"/i
      const match = description.match(imgRegex)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  /**
   * Clean Description Text
   * 
   * Sanitizes HTML description text for display by:
   * 1. Removing image tags while preserving surrounding text
   * 2. Converting line breaks to spaces
   * 3. Normalizing whitespace (removing extra spaces)
   * 4. Trimming leading and trailing whitespace
   * 
   * This ensures the description text is clean and readable when displayed.
   * 
   * @param {string} description - HTML description text to clean
   * @returns {string} Cleaned description text
   */
  const cleanDescription = (description: string): string => {
    if (!description) return '';

    // Remove image tags while preserving text
    return description
      .replace(/<img[^>]*>/g, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\s\s+/g, ' ')
      .trim();
  }

  /**
   * Check if Post is a Retweet
   * 
   * Determines whether an X post is a retweet by checking for common retweet
   * indicators in both the description and title fields. This allows the UI
   * to visually distinguish between original posts and retweets.
   * 
   * The function looks for patterns like:
   * - Text starting with "RT @"
   * - Text containing " RT @"
   * - Text matching the pattern "Retweeted @username"
   * 
   * @param {string} description - Description text of the post
   * @param {string} title - Title of the post
   * @returns {boolean} True if the post is a retweet, false otherwise
   */
  const isRetweet = (description: string, title: string): boolean => {
    if (!description && !title) return false;

    // Check description first
    if (description) {
      // Common retweet indicators
      if (description.startsWith('RT @') ||
        description.includes(' RT @') ||
        /Retweeted\s+@\w+/i.test(description)) {
        return true;
      }
    }

    // Check title as a fallback
    if (title) {
      if (title.startsWith('RT @') ||
        title.includes(' RT @') ||
        /Retweeted\s+@\w+/i.test(title)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Loading State Render
   * 
   * Displays a loading spinner and message while the RSS feed is being fetched.
   * Maintains the widget header with title for context during loading.
   * Applies appropriate theme-specific styling based on the current theme.
   */
  if (loading) {
    return (
      <div className={`${styles.container} ${theme === 'dark' ? 'dark-rss' : ''}`} style={darkModeStyles}>
        <div className={styles.widgetHeader}>
          <div className={styles.widgetTitleContainer}>
            <TwitterXIcon className={styles.widgetIcon} />
            <h3
              className={styles.title}
              style={theme === 'dark' ? { color: '#f9fafb' } : {}}
            >{title}</h3>
          </div>
        </div>
        <div className={styles.loading} style={theme === 'dark' ? { color: '#d1d5db' } : {}}>
          <div className={styles.spinner}></div>
          <p>Loading X posts...</p>
        </div>
      </div>
    )
  }

  /**
   * Error State Render
   * 
   * Displays an error message when the RSS feed fails to load.
   * Maintains the widget header with title for context during error state.
   * Uses appropriate error styling with theme-specific color adjustments.
   */
  if (error) {
    return (
      <div className={`${styles.container} ${theme === 'dark' ? 'dark-rss' : ''}`} style={darkModeStyles}>
        <div className={styles.widgetHeader}>
          <div className={styles.widgetTitleContainer}>
            <TwitterXIcon className={styles.widgetIcon} />
            <h3
              className={styles.title}
              style={theme === 'dark' ? { color: '#f9fafb' } : {}}
            >{title}</h3>
          </div>
        </div>
        <div className={styles.error} style={theme === 'dark' ? { color: '#f87171' } : {}}>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  /**
   * Empty State Render
   * 
   * Displays a message when the RSS feed is successfully fetched but contains no items.
   * Maintains the widget header with title for context during empty state.
   * Uses appropriate styling with theme-specific color adjustments.
   */
  if (!feedData || !feedData.items || feedData.items.length === 0) {
    return (
      <div className={`${styles.container} ${theme === 'dark' ? 'dark-rss' : ''}`} style={darkModeStyles}>
        <div className={styles.widgetHeader}>
          <div className={styles.widgetTitleContainer}>
            <TwitterXIcon className={styles.widgetIcon} />
            <h3
              className={styles.title}
              style={theme === 'dark' ? { color: '#f9fafb' } : {}}
            >{title}</h3>
          </div>
        </div>
        <div className={styles.empty} style={theme === 'dark' ? { color: '#d1d5db' } : {}}>
          <p>No X posts found.</p>
        </div>
      </div>
    )
  }

  /**
   * Limit Display Items
   * 
   * Limits the number of items displayed to the count specified in props.
   * This allows the component to be configured to show different numbers of items
   * based on available space or design requirements.
   */
  // Only display the requested number of items
  const displayItems = feedData.items.slice(0, count)

  /**
   * Main Component Render
   * 
   * Renders the RSS feed items with appropriate styling and theme integration.
   * The component structure includes:
   * 1. A header with title and view more link
   * 2. A content area with a list of feed items
   * 3. Each item displays publication date, post type (original/retweet), text content, and image if available
   * 
   * Theme integration is handled through both CSS modules and inline styles.
   */
  return (
    <div
      className={`${styles.container} ${theme === 'dark' ? 'dark-rss' : ''}`}
      style={darkModeStyles}>
      <div className={styles.widgetHeader}>
        <div className={styles.widgetTitleContainer}>
          <TwitterXIcon className={styles.widgetIcon} />
          <h3 className={styles.title} style={theme === 'dark' ? { color: '#f9fafb' } : {}}>{title}</h3>
        </div>
        <div className={styles.widgetActions}>
          <a 
            href="https://x.com/FCITKAU" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.viewButton}
            onMouseEnter={() => setIsViewMoreHovered(true)}
            onMouseLeave={() => setIsViewMoreHovered(false)}
            style={theme === 'dark' ? { 
              background: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
              color: '#f9fafb'
            } : {}}
          >
            <span>View X</span>
            <ArrowRightIcon 
              className={`${styles.arrowIcon} ${isViewMoreHovered ? styles.arrowIconHovered : ''}`}
            />
          </a>
        </div>
      </div>
      
      <div className={styles.widgetContent}>
        <ul className={styles.items}>
          {displayItems.map((item, index) => {
            const imageUrl = getImageUrl(item);
            const cleanedDescription = cleanDescription(item.description);
            
            return (
              <li 
                key={index} 
                className={`${styles.item} ${theme === 'dark' ? 'dark-rss' : ''}`}
                style={theme === 'dark' ? {
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  borderColor: 'rgba(71, 85, 105, 0.5)',
                  color: '#f9fafb'
                } : {}}>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  <div className={styles.itemContent}>
                    <div className={styles.tweetHeader}>
                      {item.pubDate && (
                        <span 
                          className={styles.date}
                          style={theme === 'dark' ? { color: '#9ca3af' } : {}}
                        >{formatDate(item.pubDate)}</span>
                      )}
                      <span 
                        className={isRetweet(item.description, item.title) ? styles.retweetBadge : styles.tweetBadge}
                        style={theme === 'dark' && isRetweet(item.description, item.title) 
                          ? { backgroundColor: 'rgba(99, 102, 241, 0.2)', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' } 
                          : theme === 'dark' 
                            ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' } 
                            : {}
                        }
                      >
                        {isRetweet(item.description, item.title) ? 'Retweet' : 'Post'}
                      </span>
                    </div>
                    
                    <p 
                      className={styles.description} 
                      style={theme === 'dark' ? { color: '#d1d5db' } : {}}
                      dangerouslySetInnerHTML={{ __html: cleanedDescription }}></p>
                    
                    {imageUrl && (
                      <div 
                        className={styles.imageContainer}
                        style={theme === 'dark' ? { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderColor: 'rgba(51, 65, 85, 0.5)' } : {}}
                      >
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  )
}

export default RssSimple 