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

import { useEffect, useState, useRef } from 'react'
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
 * The component adapts to both light and dark themes, providing a consistent
 * user experience across the application.
 * 
 * @param {RssSimpleProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const RssSimple = ({ url, title = 'Latest Updates', count = 3 }: RssSimpleProps) => {
  // State for feed data, loading status, and error handling
  const [feedData, setFeedData] = useState<FeedData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isViewMoreHovered, setIsViewMoreHovered] = useState<boolean>(false)
  
  // Get current theme from context
  const { theme } = useTheme()
  
  // Refs for tweet items to apply theme
  const itemRefs = useRef<HTMLElement[]>([])
  
  // Function to add item refs for theme application
  const addItemRef = (el: HTMLElement | null) => {
    if (el && !itemRefs.current.includes(el)) {
      itemRefs.current.push(el)
    }
  }
  
  /**
   * Force Apply Theme
   * 
   * Forcefully applies theme styles to all tweet items using inline styles.
   * This ensures proper theme application even when CSS modules might be
   * overridden by other styles or when theme changes dynamically.
   */
  const forceApplyTheme = () => {
    // Apply theme to the container element as well
    const container = document.querySelector(`.${styles.container}`);
    if (container) {
      if (theme === 'dark') {
        container.classList.add('dark-rss');
      } else {
        container.classList.remove('dark-rss');
      }
    }
    
    // Apply theme to each item
    itemRefs.current.forEach(item => {
      if (!item) return;
      
      if (theme === 'dark') {
        item.classList.add('dark-rss');
        
        // Apply dark mode styles directly with !important - exact match from StudentCountWidget
        item.style.setProperty('background-color', 'rgba(17, 24, 39, 0.5)', 'important'); // bg-gray-900/50
        item.style.setProperty('border-color', 'rgba(31, 41, 55, 0.5)', 'important');     // border-gray-800/50
        item.style.setProperty('color', '#f8fafc', 'important');
        item.style.setProperty('box-shadow', '0 0 30px rgba(6, 78, 59, 0.05), 0 0 60px rgba(0, 0, 0, 0.2)', 'important');
        
        // Force text color on description elements
        const descriptions = item.querySelectorAll(`.${styles.description}`);
        descriptions.forEach(desc => {
          if (desc instanceof HTMLElement) {
            desc.style.setProperty('color', '#f9fafb', 'important');
          }
        });
      } else {
        item.classList.remove('dark-rss');
        
        // Reset to light mode styles
        item.style.removeProperty('background-color');
        item.style.removeProperty('border-color');
        item.style.removeProperty('color');
        item.style.removeProperty('box-shadow');
        
        // Reset description color
        const descriptions = item.querySelectorAll(`.${styles.description}`);
        descriptions.forEach(desc => {
          if (desc instanceof HTMLElement) {
            desc.style.removeProperty('color');
          }
        });
        
        // Re-apply light mode styles
        item.style.setProperty('background-color', 'rgba(255, 255, 255, 0.8)', 'important');
        item.style.setProperty('border-color', 'rgba(203, 213, 225, 0.5)', 'important');
        item.style.setProperty('color', '#1e293b', 'important');
        item.style.setProperty('box-shadow', '0 2px 4px rgba(0, 0, 0, 0.05)', 'important');
      }
    });
  }
  
  // Apply theme immediately and set up a MutationObserver to watch for DOM changes
  useEffect(() => {
    forceApplyTheme();
    
    // Set up multiple timeouts to catch any items added after initial render
    const timeouts = [100, 500, 1000, 2000].map(delay => 
      setTimeout(() => forceApplyTheme(), delay)
    );
    
    // Set up a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(() => {
      forceApplyTheme();
    });
    
    // Start observing the document body for DOM changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    return () => {
      timeouts.forEach(clearTimeout);
      observer.disconnect();
    };
  }, [theme])
  
  // Effect to fetch feed data when component mounts or URL changes
  useEffect(() => {
    /**
     * Fetch Feed Data
     * 
     * Fetches RSS feed data from the specified URL via API.
     * Handles loading states, errors, and data processing.
     */
    const fetchFeed = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Use API route to fetch RSS feed
        const response = await fetch(`/api/rss?url=${encodeURIComponent(url)}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch feed: ${response.statusText}`)
        }
        
        const data = await response.json()
        setFeedData(data)
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
   * Format Date
   * 
   * Formats a date string into a more readable format.
   * 
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown date'
      }
      
      // Format date as relative time (e.g., "2 hours ago")
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      
      if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
      }
      
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      }
      
      const diffDays = Math.floor(diffHours / 24)
      if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
      }
      
      // For older dates, use simple date format
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Unknown date'
    }
  }
  
  /**
   * Get All Images from Feed Item
   * 
   * Extracts all images from a feed item using multiple strategies:
   * 1. First checks for media attachments with image MIME types
   * 2. Extracts all image URLs from HTML content or description
   * 3. Checks for pic.twitter.com links which are commonly used for images
   * 
   * This function ensures we can display all images from RSS feeds even when they're
   * structured differently or don't explicitly provide media attachments.
   * 
   * @param {FeedItem} item - The feed item to extract images from
   * @returns {string[]} Array of image URLs found in the item
   */
  const getAllImages = (item: FeedItem): string[] => {
    const images: string[] = []
    
    // First check if we have media content from our API
    if (item.media && item.media.length > 0) {
      // Filter for image types
      const imageMedia = item.media.filter(m =>
        m.type.startsWith('image/') || m.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      )

      imageMedia.forEach(media => {
        if (media.url && !images.includes(media.url)) {
          images.push(media.url)
        }
      })
    }

    // Extract from content
    if (item.content) {
      const contentImages = extractImagesFromHtml(item.content)
      contentImages.forEach(url => {
        if (!images.includes(url)) {
          images.push(url)
        }
      })
    }

    // Extract from description
    if (item.description) {
      const descriptionImages = extractImagesFromHtml(item.description)
      descriptionImages.forEach(url => {
        if (!images.includes(url)) {
          images.push(url)
        }
      })
    }
    
    // Check for Twitter image links in title or description
    const checkForTwitterPics = (text: string) => {
      // Look for pic.twitter.com links
      const twitterPicRegex = /https?:\/\/pic\.twitter\.com\/[a-zA-Z0-9]+/g
      const matches = text.match(twitterPicRegex)
      if (matches) {
        // For each pic.twitter.com link, add a constructed image URL
        matches.forEach(match => {
          // Extract the ID from the pic.twitter.com URL
          const id = match.split('/').pop()
          if (id) {
            // Construct a likely image URL (Twitter images are often stored on twimg.com)
            const possibleImageUrl = `https://pbs.twimg.com/media/${id}?format=jpg&name=medium`
            if (!images.includes(possibleImageUrl)) {
              images.push(possibleImageUrl)
            }
          }
        })
      }
    }
    
    // Check title and description for Twitter pic links
    if (item.title) checkForTwitterPics(item.title)
    if (item.description) checkForTwitterPics(item.description)

    return images
  }
  
  /**
   * Extract All Image URLs from HTML Content
   * 
   * Uses regular expressions to find all image URLs within HTML content.
   * Also extracts image URLs from direct links to image files.
   * 
   * @param {string} html - HTML content that might contain image tags or image links
   * @returns {string[]} Array of image URLs found in the HTML
   */
  const extractImagesFromHtml = (html: string): string[] => {
    const images: string[] = []
    
    // Extract images from img tags
    const imgRegex = /<img[^>]+src="([^"]+)"/gi
    let imgMatch
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      if (imgMatch && imgMatch[1]) {
        // Filter out tiny icons and emoji-sized images (usually < 50px)
        if (!imgMatch[0].includes('width="16"') && 
            !imgMatch[0].includes('height="16"') && 
            !imgMatch[0].includes('emoji')) {
          images.push(imgMatch[1])
        }
      }
    }
    
    // Extract images from links to image files
    const linkRegex = /<a[^>]*href="([^"]*\.(jpg|jpeg|png|gif|webp))"[^>]*>/gi
    let linkMatch
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      if (linkMatch && linkMatch[1] && !images.includes(linkMatch[1])) {
        images.push(linkMatch[1])
      }
    }
    
    // Extract direct image URLs in text
    const urlRegex = /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|webp)/gi
    let urlMatch
    while ((urlMatch = urlRegex.exec(html)) !== null) {
      if (urlMatch && urlMatch[0] && !images.includes(urlMatch[0])) {
        images.push(urlMatch[0])
      }
    }
    
    // Filter out duplicates and return
    return [...new Set(images)]
  }
  
  /**
   * Clean Description Text
   * 
   * Sanitizes HTML description text for display by:
   * 1. Converting image tags to placeholders that we'll handle separately
   * 2. Converting line breaks to spaces
   * 3. Normalizing whitespace (removing extra spaces)
   * 4. Trimming leading and trailing whitespace
   * 5. Removing any links to image files (which will be displayed as actual images)
   * 
   * This ensures the description text is clean and readable when displayed.
   * 
   * @param {string} description - HTML description text to clean
   * @returns {string} Cleaned description text
   */
  const cleanDescription = (description: string): string => {
    if (!description) return ''

    // Replace image tags with a placeholder
    let cleanedText = description
      // Replace image tags with a placeholder
      .replace(/<img[^>]*>/g, '')
      // Replace <br> tags with spaces
      .replace(/<br\s*\/?>/gi, ' ')
      // Replace multiple spaces with a single space
      .replace(/\s\s+/g, ' ')
      // Remove links to image files
      .replace(/<a[^>]*href="[^"]*\.(jpg|jpeg|png|gif|webp)"[^>]*>[^<]*<\/a>/gi, '')
      // Remove any remaining image URLs
      .replace(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi, '')
      // Trim leading/trailing whitespace
      .trim()
      
    return cleanedText
  }
  
  /**
   * Check if Post is a Retweet
   * 
   * Determines whether an X post is a retweet by checking for common retweet
   * indicators in the title or description.
   * 
   * @param {string} description - Post description to check
   * @param {string} title - Post title to check
   * @returns {boolean} True if the post is a retweet, false otherwise
   */
  const isRetweet = (description: string, title: string): boolean => {
    if (!description && !title) return false
    
    // Check for common retweet indicators
    const retweetIndicators = [
      'retweeted',
      'RT @',
      'Retweet',
      'reposted'
    ]
    
    // Check title
    if (title) {
      const lowerTitle = title.toLowerCase()
      for (const indicator of retweetIndicators) {
        if (lowerTitle.includes(indicator.toLowerCase())) {
          return true
        }
      }
    }
    
    // Check description
    if (description) {
      const lowerDesc = description.toLowerCase()
      for (const indicator of retweetIndicators) {
        if (lowerDesc.includes(indicator.toLowerCase())) {
          return true
        }
      }
    }

    return false
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
      <div className={`${styles.container} ${theme === 'dark' ? 'dark-rss' : ''}`}>
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
      <div className={`${styles.container} ${theme === 'dark' ? 'dark-rss' : ''}`}>
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
      <div className={`${styles.container} ${theme === 'dark' ? 'dark-rss' : ''}`}>
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
      className={`${styles.container} ${theme === 'dark' ? 'dark' : ''}`}
       data-theme={theme}
     >
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
            // Extract all images from the item
            const images = getAllImages(item)
            
            // Clean the description for display
            const cleanedDescription = cleanDescription(item.description || '')
            
            // Check if this is a retweet
            const isRetweeted = item.title?.toLowerCase().includes('retweeted') || 
                               item.description?.toLowerCase().includes('retweeted')

            return (
              <li 
                key={index} 
                className={`${styles.item} ${theme === 'dark' ? 'dark-rss' : ''}`}
                ref={el => addItemRef(el)}
              >
                <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  <div className={styles.itemContent}>
                    {/* Tweet Header with Date and Badge */}
                    <div className={styles.tweetHeader}>
                      {/* FCIT KAU Avatar */}
                      <div className={styles.tweetAuthor}>
                        <div className={styles.avatarContainer}>
                          <div className={styles.hashtagAvatar}>#</div>
                        </div>
                        <div className={styles.authorInfo}>
                          <span className={styles.authorName}>FCIT KAU</span>
                          <span className={styles.authorHandle}>@FCITKAU</span>
                        </div>
                      </div>
                      <div className={styles.tweetMeta}>
                        <span className={styles.date}>
                          {formatDate(item.pubDate)}
                        </span>
                        <span 
                          className={isRetweeted ? styles.retweetBadge : styles.tweetBadge}
                        >
                          {isRetweeted ? 'Retweet' : 'Post'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tweet Content */}
                    <div className={styles.tweetContent}>
                      {/* Text Content */}
                      <p className={styles.description} 
                         style={{ color: theme === 'dark' ? '#f9fafb' : '#1e293b' }}
                         dangerouslySetInnerHTML={{ __html: cleanedDescription }}></p>
                      
                      {/* Image Gallery */}
                      {images.length > 0 && (
                        <div className={`${styles.imageGallery} ${images.length > 1 ? styles.multipleImages : ''}`}>
                          {images.map((imageUrl, imgIndex) => (
                            <div 
                              key={imgIndex} 
                              className={styles.imageContainer}
                            >
                              <Image
                                src={imageUrl}
                                alt={`Tweet image ${imgIndex + 1}`}
                                width={400}
                                height={225}
                                className={styles.tweetImage}
                                priority={index < 2 && imgIndex === 0} // Prioritize first image of first two tweets
                                onError={(e) => {
                                  // Hide the image container if the image fails to load
                                  const target = e.target as HTMLImageElement
                                  const container = target.closest(`.${styles.imageContainer}`) as HTMLElement | null
                                  if (container) {
                                    container.style.display = 'none'
                                  }
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Tweet Footer */}
                    <div className={styles.tweetFooter}>
                      <span className={styles.viewOnX}>
                        View on X
                      </span>
                    </div>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default RssSimple
