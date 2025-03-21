'use client'

import { useEffect, useState } from 'react'
import styles from './RssSimple.module.css'

interface MediaItem {
  url: string
  type: string
  width?: number
  height?: number
  length?: number
}

interface FeedItem {
  title: string
  link: string
  description: string
  pubDate: string
  content: string
  media: MediaItem[]
}

interface FeedData {
  title: string
  description: string
  link: string
  items: FeedItem[]
}

interface RssSimpleProps {
  url: string
  title?: string
  count?: number
}

const RssSimple = ({ url, title = "Latest Updates", count = 3 }: RssSimpleProps) => {
  const [feedData, setFeedData] = useState<FeedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true)
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

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (e) {
      return dateString
    }
  }

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

  const extractImageFromContent = (content: string, description: string): string | null => {
    // First try to find image in content
    if (content) {
      const imgRegex = /<img[^>]+src="([^">]+)"/i
      const match = content.match(imgRegex)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    // If no image in content, try description
    if (description) {
      const imgRegex = /<img[^>]+src="([^">]+)"/i
      const match = description.match(imgRegex)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }

  // Clean up description text
  const cleanDescription = (description: string): string => {
    if (!description) return '';
    
    // Remove image tags while preserving text
    return description
      .replace(/<img[^>]*>/g, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\s\s+/g, ' ')
      .trim();
  }

  // Check if the tweet is a retweet
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

  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading tweets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!feedData || !feedData.items || feedData.items.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.empty}>
          <p>No tweets found.</p>
        </div>
      </div>
    )
  }

  // Only display the requested number of items
  const displayItems = feedData.items.slice(0, count)

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.items}>
        {displayItems.map((item, index) => {
          const imageUrl = getImageUrl(item);
          const cleanedDescription = cleanDescription(item.description);
          
          return (
            <li key={index} className={styles.item}>
              <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                <div className={styles.itemContent}>
                  <div className={styles.tweetHeader}>
                    {item.pubDate && (
                      <span className={styles.date}>{formatDate(item.pubDate)}</span>
                    )}
                    <span className={isRetweet(item.description, item.title) ? styles.retweetBadge : styles.tweetBadge}>
                      {isRetweet(item.description, item.title) ? 'Retweet' : 'Post'}
                    </span>
                  </div>
                  
                  <p className={styles.description} dangerouslySetInnerHTML={{ __html: cleanedDescription }}></p>
                  
                  {imageUrl && (
                    <div className={styles.imageContainer}>
                      <img 
                        src={imageUrl} 
                        alt="Tweet media" 
                        className={styles.tweetImage}
                        onError={(e) => {
                          // Hide broken images
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      <div className={styles.footer}>
        <a 
          href="https://x.com/FCITKAU" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.viewMore}
        >
          View more tweets
        </a>
      </div>
    </div>
  )
}

export default RssSimple 