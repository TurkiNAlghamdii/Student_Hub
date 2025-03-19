import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'Missing URL parameter' },
      { status: 400 }
    )
  }

  try {
    // Fetch the RSS feed
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Student-Hub/1.0'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`)
    }

    const xmlData = await response.text()
    
    // Parse the XML with options to preserve media content
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '_',
      isArray: (name) => ['item', 'media:content', 'enclosure'].includes(name),
      processEntities: true,
      htmlEntities: true
    })
    
    const result = parser.parse(xmlData)
    
    // Extract feed data 
    const channel = result.rss?.channel || {}
    const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean)
    
    // Format the response with enhanced media content
    const feedData = {
      title: channel.title || 'RSS Feed',
      description: channel.description || '',
      link: channel.link || '',
      items: items.map((item: any) => {
        // Process media content from various possible sources
        const media = extractMediaContent(item)
        
        return {
          title: item.title || 'No Title',
          link: item.link || '',
          description: item.description || '',
          pubDate: item.pubDate || '',
          content: item['content:encoded'] || item.content || '',
          media: media
        }
      })
    }

    return NextResponse.json(feedData)
  } catch (error) {
    console.error('Error fetching RSS feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch or parse the RSS feed' },
      { status: 500 }
    )
  }
}

// Helper function to extract media content from various RSS formats
function extractMediaContent(item: any): any[] {
  const mediaContent = []
  
  // Check media:content tags
  if (item['media:content']) {
    const mediaItems = Array.isArray(item['media:content']) 
      ? item['media:content'] 
      : [item['media:content']]
    
    mediaItems.forEach((media: any) => {
      if (media && media._url) {
        mediaContent.push({
          url: media._url,
          type: media._type || 'image/jpeg',
          width: media._width,
          height: media._height
        })
      }
    })
  }
  
  // Check enclosures
  if (item.enclosure) {
    const enclosures = Array.isArray(item.enclosure)
      ? item.enclosure
      : [item.enclosure]
    
    enclosures.forEach((enclosure: any) => {
      if (enclosure && enclosure._url) {
        mediaContent.push({
          url: enclosure._url,
          type: enclosure._type || 'image/jpeg',
          length: enclosure._length
        })
      }
    })
  }
  
  // Try to extract images from content or description as fallback
  if (mediaContent.length === 0) {
    const content = item['content:encoded'] || item.content || item.description || ''
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i)
    if (imgMatch && imgMatch[1]) {
      mediaContent.push({
        url: imgMatch[1],
        type: 'image/jpeg'
      })
    }
  }
  
  return mediaContent
} 