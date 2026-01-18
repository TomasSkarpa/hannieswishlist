import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesFromKV, saveCategoriesToKV } from '@/lib/kv';

export async function GET() {
  try {
    const categories = await getCategoriesFromKV();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { categories } = await request.json();
    
    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Categories must be an array' },
        { status: 400 }
      );
    }

    await saveCategoriesToKV(categories);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving categories:', error);
    return NextResponse.json(
      { error: 'Failed to save categories' },
      { status: 500 }
    );
  }
}
