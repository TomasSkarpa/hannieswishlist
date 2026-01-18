import { createClient } from 'redis';

const ITEMS_KEY = 'wishlist:items';
const CATEGORIES_KEY = 'wishlist:categories';

// Redis client singleton for Next.js serverless functions
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }
  }

  isConnecting = true;
  try {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    redisClient = createClient({ url });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    return redisClient;
  } finally {
    isConnecting = false;
  }
}

export async function getItemsFromKV(): Promise<any[]> {
  try {
    const client = await getRedisClient();
    const data = await client.get(ITEMS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching items from Redis:', error);
    return [];
  }
}

export async function saveItemsToKV(items: any[]): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.set(ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving items to Redis:', error);
    throw error;
  }
}

export async function getCategoriesFromKV(): Promise<string[]> {
  try {
    const client = await getRedisClient();
    const data = await client.get(CATEGORIES_KEY);
    if (!data) return ['Uncategorized'];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching categories from Redis:', error);
    return ['Uncategorized'];
  }
}

export async function saveCategoriesToKV(categories: string[]): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.set(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories to Redis:', error);
    throw error;
  }
}
