import { NextRequest, NextResponse } from 'next/server';
import { getItemsFromKV, saveItemsToKV } from '@/lib/kv';

export async function GET() {
  try {
    const items = await getItemsFromKV();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();
    
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      );
    }

    await saveItemsToKV(items);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving items:', error);
    return NextResponse.json(
      { error: 'Failed to save items' },
      { status: 500 }
    );
  }
}
