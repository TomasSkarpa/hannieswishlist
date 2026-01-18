import { NextRequest, NextResponse } from 'next/server';
import { getLinkPreview } from 'link-preview-js';

// Fallback function to extract basic metadata from HTML
async function extractBasicMetadata(url: string): Promise<{ title?: string; description?: string; siteName?: string; image?: string; images?: string[] }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
      // If we get a 403/401, the site is blocking us
      if (response.status === 403 || response.status === 401) {
        return {};
      }
      return {};
    }

    const html = await response.text();
    
    // Check if the HTML contains access denied messages
    const blockedIndicators = [
      'access denied',
      'zugriff verweigert',
      'forbidden',
      '403',
      '401',
    ];
    const htmlLower = html.toLowerCase();
    if (blockedIndicators.some(indicator => htmlLower.includes(indicator))) {
      return {};
    }
    const result: { title?: string; description?: string; siteName?: string; image?: string; images?: string[] } = {};

    // Extract title - try og:title first, then <title> tag
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                            html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      result.title = ogTitleMatch[1].trim();
    } else {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        result.title = titleMatch[1].trim();
      }
    }

    // Extract description from meta tags (try multiple variations)
    const descPatterns = [
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i,
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i,
    ];

    for (const pattern of descPatterns) {
      const descMatch = html.match(pattern);
      if (descMatch && descMatch[1]) {
        result.description = descMatch[1].trim();
        break;
      }
    }

    // Extract images - try og:image first
    const imagePatterns = [
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
      /<meta\s+name=["']image["']\s+content=["']([^"']+)["']/i,
    ];
    
    const images: string[] = [];
    for (const pattern of imagePatterns) {
      const imageMatch = html.match(pattern);
      if (imageMatch && imageMatch[1]) {
        const imageUrl = imageMatch[1].trim();
        if (imageUrl && !images.includes(imageUrl)) {
          images.push(imageUrl);
        }
      }
    }
    
    if (images.length > 0) {
      result.image = images[0];
      result.images = images;
    }

    // Extract site name from og:site_name
    const siteNameMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i) ||
                           html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:site_name["']/i);
    if (siteNameMatch && siteNameMatch[1]) {
      result.siteName = siteNameMatch[1].trim();
    }

    // If no siteName, try to extract from domain
    if (!result.siteName) {
      try {
        const urlObj = new URL(url);
        result.siteName = urlObj.hostname.replace(/^www\./, '');
      } catch {
        // Ignore URL parsing errors
      }
    }

    return result;
  } catch (error) {
    console.error('Error extracting basic metadata:', error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let preview: any = {};
    let usedFallback = false;

    // Try link-preview-js first (better results, handles more cases)
    try {
      preview = await getLinkPreview(url, {
        imagesPropertyType: 'og',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000, // 10 second timeout
      });
      
      // Check if link-preview-js returned useful data
      // If it only returned a domain name or empty data, try fallback
      const hasUsefulData = preview.title && 
                           preview.title.trim().length > 0 &&
                           preview.title.toLowerCase() !== url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
      
      if (!hasUsefulData && (!preview.description || preview.description.trim().length === 0)) {
        console.warn('link-preview-js returned minimal data, trying fallback');
        // link-preview-js didn't return useful data, try fallback
        const basicMeta = await extractBasicMetadata(url);
        if (basicMeta.title && basicMeta.title.trim().length > 0 && 
            basicMeta.title.toLowerCase() !== url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()) {
          // Fallback has better data, use it
          preview = { ...preview, ...basicMeta };
          usedFallback = true;
          console.log('Fallback extracted better data:', { title: preview.title, hasDescription: !!preview.description, hasImage: !!preview.image });
        }
      }
    } catch (error) {
      console.warn('link-preview-js failed with error, trying fallback:', error);
      // If link-preview-js throws an error, try basic HTML parsing
      const basicMeta = await extractBasicMetadata(url);
      if (basicMeta.title || basicMeta.description || basicMeta.image) {
        preview = basicMeta;
        usedFallback = true;
        console.log('Fallback extracted:', { title: preview.title, hasDescription: !!preview.description, hasImage: !!preview.image });
      } else {
        console.warn('Fallback also failed, using domain name');
        // If both fail, still try to get domain name
        try {
          const urlObj = new URL(url);
          preview = {
            title: urlObj.hostname.replace(/^www\./, ''),
            siteName: urlObj.hostname.replace(/^www\./, ''),
          };
        } catch {
          // If URL parsing fails, return empty
        }
      }
    }

    // Check if the preview content is unhelpful or blocked
    const title = (preview.title || preview.siteName || '').toLowerCase().trim();
    const unhelpfulTitles = [
      'just a moment',
      'checking security',
      'please wait',
      'loading',
      'access denied',
      'zugriff verweigert',
      'forbidden',
      '403',
      '401',
    ];
    
    // Only mark as unhelpful if title is actually blocked, not if it's just short
    // Short titles like "zalando.cz" are valid domain names, not errors
    const isUnhelpful = unhelpfulTitles.some(bad => title.includes(bad));

    // If we got blocked/unhelpful content, try to use domain name instead
    if (isUnhelpful && preview.title) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace(/^www\./, '');
        preview.title = domain;
        preview.siteName = preview.siteName || domain;
      } catch {
        // If URL parsing fails, keep original
      }
    }

    // Only set domain as title if we truly have no title
    // Don't overwrite if we have a valid title from the preview
    if (!preview.title && !preview.siteName) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace(/^www\./, '');
        preview.title = domain;
        preview.siteName = domain;
      } catch {
        preview.title = 'Untitled';
      }
    } else if (!preview.siteName && preview.title) {
      // If we have a title but no siteName, try to extract from domain
      try {
        const urlObj = new URL(url);
        preview.siteName = urlObj.hostname.replace(/^www\./, '');
      } catch {
        // Ignore
      }
    }

    return NextResponse.json({
      ...preview,
      _unhelpful: isUnhelpful, // Flag to indicate preview may be incomplete
      _fallback: usedFallback, // Flag to indicate we used fallback method
    });
  } catch (error) {
    console.error('Error fetching link preview:', error);
    
    // Last resort: try basic extraction even on error
    try {
      const { url } = await request.json();
      const basicMeta = await extractBasicMetadata(url);
      if (basicMeta.title || basicMeta.description) {
        return NextResponse.json({
          ...basicMeta,
          _fallback: true,
        });
      }
    } catch {
      // Ignore errors in fallback
    }

    return NextResponse.json(
      { error: 'Failed to fetch link preview' },
      { status: 500 }
    );
  }
}
