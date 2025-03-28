'use client'

import { useEffect, useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import TwitterXIcon from '../icons/TwitterXIcon'
import styles from './RssSimple.module.css'
import Image from 'next/image'

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
  const [isViewMoreHovered, setIsViewMoreHovered] = useState(false)

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <div className={styles.widgetHeader}>
          <div className={styles.widgetTitleContainer}>
            <TwitterXIcon className={styles.widgetIcon} />
            <h3 className={styles.title}>{title}</h3>
          </div>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading X posts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.widgetHeader}>
          <div className={styles.widgetTitleContainer}>
            <TwitterXIcon className={styles.widgetIcon} />
            <h3 className={styles.title}>{title}</h3>
          </div>
        </div>
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!feedData || !feedData.items || feedData.items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.widgetHeader}>
          <div className={styles.widgetTitleContainer}>
            <TwitterXIcon className={styles.widgetIcon} />
            <h3 className={styles.title}>{title}</h3>
          </div>
        </div>
        <div className={styles.empty}>
          <p>No X posts found.</p>
        </div>
      </div>
    )
  }

  // Only display the requested number of items
  const displayItems = feedData.items.slice(0, count)

  return (
    <div className={styles.container}>
      <div className={styles.widgetHeader}>
        <div className={styles.widgetTitleContainer}>
          <TwitterXIcon className={styles.widgetIcon} />
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.widgetActions}>
          <a 
            href="https://x.com/FCITKAU" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.viewButton}
            onMouseEnter={() => setIsViewMoreHovered(true)}
            onMouseLeave={() => setIsViewMoreHovered(false)}
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