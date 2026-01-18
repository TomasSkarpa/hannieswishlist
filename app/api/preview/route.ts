import { NextRequest, NextResponse } from 'next/server';
import { getLinkPreview } from 'link-preview-js';

// Fallback function to extract basic metadata from HTML
async function extractBasicMetadata(url: string): Promise<{ title?: string; description?: string; siteName?: string }> {
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
    const result: { title?: string; description?: string; siteName?: string } = {};

    // Extract title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      result.title = titleMatch[1].trim();
    }

    // Extract description from meta tags (try multiple variations)
    const descPatterns = [
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i,
    ];

    for (const pattern of descPatterns) {
      const descMatch = html.match(pattern);
      if (descMatch && descMatch[1]) {
        result.description = descMatch[1].trim();
        break;
      }
    }

    // Extract site name from og:site_name
    const siteNameMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
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
    } catch (error) {
      console.warn('link-preview-js failed, trying fallback:', error);
      // If link-preview-js fails, try basic HTML parsing
      const basicMeta = await extractBasicMetadata(url);
      if (basicMeta.title || basicMeta.description) {
        preview = basicMeta;
        usedFallback = true;
      } else {
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
    
    const isUnhelpful = unhelpfulTitles.some(bad => title.includes(bad)) || title.length < 3;

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

    // Ensure we always have at least a domain name
    if (!preview.title && !preview.siteName) {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace(/^www\./, '');
        preview.title = domain;
        preview.siteName = domain;
      } catch {
        preview.title = 'Untitled';
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
