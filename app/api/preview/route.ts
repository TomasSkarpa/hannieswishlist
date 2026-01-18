import { NextRequest, NextResponse } from 'next/server';
import { getLinkPreview } from 'link-preview-js';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const preview = await getLinkPreview(url, {
      imagesPropertyType: 'og',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000, // 10 second timeout
    });

    // Check if the preview content is unhelpful
    const title = preview.title?.toLowerCase().trim() || '';
    const unhelpfulTitles = [
      'just a moment',
      'checking security',
      'please wait',
      'loading',
      'access denied',
      'forbidden',
    ];
    
    const isUnhelpful = unhelpfulTitles.some(bad => title.includes(bad)) || title.length < 3;

    return NextResponse.json({
      ...preview,
      _unhelpful: isUnhelpful, // Flag to indicate preview may be incomplete
    });
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch link preview' },
      { status: 500 }
    );
  }
}
