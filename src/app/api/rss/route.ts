/**
 * RSS Feed API Route
 * 
 * This API provides RSS feed fetching and parsing functionality for the Student Hub application.
 * It handles retrieving external RSS feeds, parsing the XML content, and transforming it into
 * a standardized JSON format that's easier for the frontend to consume.
 * 
 * The API supports various RSS formats and extracts media content from different tag structures
 * including media:content, enclosures, and embedded images in content.
 */

import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

/**
 * Type Definitions for RSS Feed Processing
 */

/**
 * MediaContent Interface
 * 
 * Represents media attachments in RSS feeds (images, audio, video)
 * Compatible with both media:content tags and enclosure tags
 * 
 * @property url - URL of the media resource
 * @property type - MIME type of the media (e.g., 'image/jpeg')
 * @property width - Optional width of the media (for images/videos)
 * @property height - Optional height of the media (for images/videos)
 * @property length - Optional file size in bytes (typically for enclosures)
 */
interface MediaContent {
  url: string;
  type: string;
  width?: number;
  height?: number;
  length?: number;
}

/**
 * RSSItem Interface
 * 
 * Represents an individual item/entry in an RSS feed
 * Handles various RSS formats with optional properties
 * 
 * @property title - Item title
 * @property link - URL to the full content
 * @property description - Short description or excerpt
 * @property pubDate - Publication date in RSS format
 * @property content:encoded - Full content in CDATA (used in some RSS formats)
 * @property content - Alternative full content field
 * @property media:content - Media attachments in media RSS namespace
 * @property enclosure - Media attachments in standard RSS format
 */
interface RSSItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  'content:encoded'?: string;
  content?: string;
  'media:content'?: MediaContent | MediaContent[];
  enclosure?: MediaContent | MediaContent[];
}

/**
 * RSSChannel Interface
 * 
 * Represents the main RSS feed container
 * Contains feed metadata and items
 * 
 * @property title - Feed title
 * @property description - Feed description
 * @property link - URL to the feed's website
 * @property item - Single item or array of items in the feed
 */
interface RSSChannel {
  title?: string;
  description?: string;
  link?: string;
  item?: RSSItem | RSSItem[];
}

/**
 * FeedItem Interface
 * 
 * Standardized format for feed items after processing
 * Used for the API response to ensure consistent structure
 * 
 * @property title - Item title (with fallback to 'No Title')
 * @property link - URL to the full content
 * @property description - Short description or excerpt
 * @property pubDate - Publication date
 * @property content - Full content from content:encoded or content fields
 * @property media - Array of media attachments in standardized format
 */
interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  content: string;
  media: MediaContent[];
}

/**
 * GET endpoint to fetch and parse an RSS feed
 * 
 * Retrieves an RSS feed from the provided URL, parses the XML content,
 * and returns a standardized JSON representation of the feed.
 * 
 * @param request - The incoming HTTP request with feed URL in query parameters
 * @returns JSON response with parsed feed data or error information
 */
export async function GET(request: NextRequest) {
  /**
   * Extract and validate the feed URL
   * The URL parameter is expected in the query string
   */
  const url = request.nextUrl.searchParams.get('url')

  // Return error if URL parameter is missing
  if (!url) {
    return NextResponse.json(
      { error: 'Missing URL parameter' },
      { status: 400 }
    )
  }

  try {
    /**
     * Fetch the RSS feed from the external source
     * 
     * Uses a custom User-Agent to identify our application to the RSS provider
     * Implements caching with a 5-minute revalidation period to reduce load
     * on the source server and improve performance
     */
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Student-Hub/1.0'  // Identify our application
      },
      next: { revalidate: 300 }  // Cache for 5 minutes
    })

    // Handle HTTP errors from the feed source
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`)
    }

    // Get the raw XML content
    const xmlData = await response.text()
    
    /**
     * Parse the XML content into a JavaScript object
     * 
     * Configuration options:
     * - Preserve XML attributes with '_' prefix
     * - Force certain elements to always be arrays for consistent handling
     * - Process HTML entities to handle special characters correctly
     */
    const parser = new XMLParser({
      ignoreAttributes: false,           // Keep XML attributes
      attributeNamePrefix: '_',         // Prefix for attributes
      isArray: (name) => ['item', 'media:content', 'enclosure'].includes(name),  // Elements that should always be arrays
      processEntities: true,            // Handle XML entities
      htmlEntities: true                // Handle HTML entities
    })
    
    // Convert XML string to JavaScript object
    const result = parser.parse(xmlData)
    
    /**
     * Extract and normalize the feed data
     * 
     * Handles different RSS structures and ensures consistent output format
     * regardless of the input feed's specific format or version
     */
    const channel = result.rss?.channel || {}  // Get channel or empty object if missing
    
    // Ensure items is always an array, even if the feed only has one item
    const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean)
    
    /**
     * Transform the feed data into a standardized format
     * 
     * Creates a consistent structure with:
     * - Feed metadata (title, description, link)
     * - Normalized items with consistent properties
     * - Extracted media content from various sources
     */
    const feedData = {
      title: channel.title || 'RSS Feed',        // Feed title with fallback
      description: channel.description || '',    // Feed description
      link: channel.link || '',                  // Feed website URL
      items: items.map((item: RSSItem) => {
        // Extract media content from various formats
        const media = extractMediaContent(item)
        
        // Return standardized item format
        return {
          title: item.title || 'No Title',                      // Item title with fallback
          link: item.link || '',                                // Item URL
          description: item.description || '',                  // Short description
          pubDate: item.pubDate || '',                          // Publication date
          content: item['content:encoded'] || item.content || '', // Full content
          media: media                                          // Media attachments
        }
      })
    }

    // Return the processed feed data as JSON
    return NextResponse.json(feedData)
  } catch (error) {
    /**
     * Global error handler
     * 
     * Catches any errors in the feed fetching or parsing process
     * and returns a user-friendly error response while logging
     * the detailed error for debugging.
     */
    console.error('Error fetching RSS feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch or parse the RSS feed' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to extract media content from various RSS formats
 * 
 * RSS feeds can include media in several different formats:
 * 1. media:content tags (MediaRSS namespace)
 * 2. enclosure tags (standard RSS)
 * 3. img tags embedded in the content or description HTML
 * 
 * This function normalizes these different formats into a consistent
 * array of MediaContent objects for easier handling by the frontend.
 * 
 * @param item - The RSS item to extract media from
 * @returns Array of standardized MediaContent objects
 */
function extractMediaContent(item: RSSItem): MediaContent[] {
  const mediaContent: MediaContent[] = []
  
  /**
   * Process media:content tags (MediaRSS namespace)
   * 
   * These are specialized tags for media in RSS feeds that include
   * additional metadata like dimensions, thumbnails, etc.
   */
  if (item['media:content']) {
    // Ensure we're working with an array even if there's only one item
    const mediaItems = Array.isArray(item['media:content']) 
      ? item['media:content'] 
      : [item['media:content']]
    
    // Process each media item
    mediaItems.forEach((media: MediaContent) => {
      if (media && media.url) {
        mediaContent.push({
          url: media.url,
          type: media.type || 'image/jpeg',  // Default to JPEG if type is missing
          width: media.width,                // Preserve dimensions if available
          height: media.height
        })
      }
    })
  }
  
  /**
   * Process enclosure tags (standard RSS)
   * 
   * Enclosures are the standard way to attach media in RSS feeds
   * They typically include a URL, MIME type, and file size
   */
  if (item.enclosure) {
    // Ensure we're working with an array even if there's only one enclosure
    const enclosures = Array.isArray(item.enclosure)
      ? item.enclosure
      : [item.enclosure]
    
    // Process each enclosure
    enclosures.forEach((enclosure: MediaContent) => {
      if (enclosure && enclosure.url) {
        mediaContent.push({
          url: enclosure.url,
          type: enclosure.type || 'image/jpeg',  // Default to JPEG if type is missing
          length: enclosure.length               // Preserve file size if available
        })
      }
    })
  }
  
  /**
   * Extract embedded images as fallback
   * 
   * If no dedicated media tags are found, try to extract images
   * from HTML content using regex to find img tags
   * 
   * This ensures we still get images for feeds that embed them
   * directly in the content rather than using media tags
   */
  if (mediaContent.length === 0) {
    // Look in all possible content fields
    const content = item['content:encoded'] || item.content || item.description || ''
    
    // Use regex to find the first img tag and extract its src attribute
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i)
    if (imgMatch && imgMatch[1]) {
      mediaContent.push({
        url: imgMatch[1],
        type: 'image/jpeg'  // Assume JPEG as we can't determine the type
      })
    }
  }
  
  return mediaContent
}