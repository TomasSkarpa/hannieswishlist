// Sync utilities for localStorage <-> Vercel KV

export async function syncItemsToKV(items: any[]): Promise<void> {
  try {
    await fetch('/api/wishlist/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
  } catch (error) {
    console.error('Failed to sync items to KV:', error);
    // Don't throw - we want to continue even if sync fails
  }
}

export async function syncCategoriesToKV(categories: string[]): Promise<void> {
  try {
    await fetch('/api/wishlist/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
  } catch (error) {
    console.error('Failed to sync categories to KV:', error);
    // Don't throw - we want to continue even if sync fails
  }
}

export async function loadItemsFromKV(): Promise<any[]> {
  try {
    const response = await fetch('/api/wishlist/items');
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Failed to load items from KV:', error);
    return [];
  }
}

export async function loadCategoriesFromKV(): Promise<string[]> {
  try {
    const response = await fetch('/api/wishlist/categories');
    if (!response.ok) return ['Uncategorized'];
    const data = await response.json();
    return data.categories || ['Uncategorized'];
  } catch (error) {
    console.error('Failed to load categories from KV:', error);
    return ['Uncategorized'];
  }
}

// Merge strategy: prefer local if it's newer, otherwise use KV
function mergeItems(localItems: any[], kvItems: any[]): any[] {
  if (localItems.length === 0) return kvItems;
  if (kvItems.length === 0) return localItems;

  // Create a map of items by ID
  const itemMap = new Map<string, any>();
  
  // Add KV items first
  kvItems.forEach(item => {
    itemMap.set(item.id, item);
  });
  
  // Override with local items (local takes precedence)
  localItems.forEach(item => {
    itemMap.set(item.id, item);
  });
  
  // Sort by createdAt (newest first)
  return Array.from(itemMap.values()).sort((a, b) => 
    (b.createdAt || 0) - (a.createdAt || 0)
  );
}

function mergeCategories(localCategories: string[], kvCategories: string[]): string[] {
  const categorySet = new Set<string>();
  
  // Add all categories
  [...localCategories, ...kvCategories].forEach(cat => categorySet.add(cat));
  
  // Ensure Uncategorized is first
  const categories = Array.from(categorySet);
  const uncategorizedIndex = categories.indexOf('Uncategorized');
  if (uncategorizedIndex > 0) {
    categories.splice(uncategorizedIndex, 1);
    categories.unshift('Uncategorized');
  } else if (uncategorizedIndex === -1) {
    categories.unshift('Uncategorized');
  }
  
  return categories.sort((a, b) => {
    if (a === 'Uncategorized') return -1;
    if (b === 'Uncategorized') return 1;
    return a.localeCompare(b);
  });
}

export { mergeItems, mergeCategories };
