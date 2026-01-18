import { kv } from '@vercel/kv';

const ITEMS_KEY = 'wishlist:items';
const CATEGORIES_KEY = 'wishlist:categories';

export async function getItemsFromKV(): Promise<any[]> {
  try {
    const items = await kv.get<any[]>(ITEMS_KEY);
    return items || [];
  } catch (error) {
    console.error('Error fetching items from KV:', error);
    return [];
  }
}

export async function saveItemsToKV(items: any[]): Promise<void> {
  try {
    await kv.set(ITEMS_KEY, items);
  } catch (error) {
    console.error('Error saving items to KV:', error);
    throw error;
  }
}

export async function getCategoriesFromKV(): Promise<string[]> {
  try {
    const categories = await kv.get<string[]>(CATEGORIES_KEY);
    return categories || ['Uncategorized'];
  } catch (error) {
    console.error('Error fetching categories from KV:', error);
    return ['Uncategorized'];
  }
}

export async function saveCategoriesToKV(categories: string[]): Promise<void> {
  try {
    await kv.set(CATEGORIES_KEY, categories);
  } catch (error) {
    console.error('Error saving categories to KV:', error);
    throw error;
  }
}
