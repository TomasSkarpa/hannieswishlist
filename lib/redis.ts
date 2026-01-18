import { createClient } from 'redis';

const ITEMS_KEY = 'wishlist:items';
const CATEGORIES_KEY = 'wishlist:categories';

// Redis client singleton for Next.js serverless functions
let redisClient: ReturnType<typeof createClient> | null = null;
let connectionPromise: Promise<ReturnType<typeof createClient>> | null = null;

async function getRedisClient() {
  // If client exists and is ready, return it
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }

  // If a connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start a new connection
  connectionPromise = (async () => {
    try {
      const url = process.env.REDIS_URL;
      if (!url) {
        throw new Error('REDIS_URL environment variable is not set');
      }

      // Create new client if needed
      if (!redisClient) {
        redisClient = createClient({ 
          url,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                console.error('Redis reconnection failed after 10 retries');
                return new Error('Redis connection failed');
              }
              return Math.min(retries * 100, 3000);
            }
          }
        });
        
        redisClient.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
          console.log('Redis client connecting...');
        });

        redisClient.on('ready', () => {
          console.log('Redis client ready');
        });
      }

      // Connect if not already connected
      if (!redisClient.isReady && !redisClient.isOpen) {
        await redisClient.connect();
      }

      return redisClient;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      connectionPromise = null;
      redisClient = null;
      throw error;
    } finally {
      // Clear the promise after a short delay to allow reuse
      setTimeout(() => {
        connectionPromise = null;
      }, 100);
    }
  })();

  return connectionPromise;
}

export async function getItemsFromRedis(): Promise<any[]> {
  try {
    const client = await getRedisClient();
    
    // Ensure client is ready
    try {
      if (!client.isReady) {
        await client.connect();
      }
    } catch (connectError) {
      // If connect fails, try to get a fresh client
      redisClient = null;
      connectionPromise = null;
      const freshClient = await getRedisClient();
      const data = await freshClient.get(ITEMS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    }
    
    const data = await client.get(ITEMS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching items from Redis:', error);
    // Reset client on error to force reconnection
    redisClient = null;
    connectionPromise = null;
    return [];
  }
}

export async function saveItemsToRedis(items: any[]): Promise<void> {
  try {
    const client = await getRedisClient();
    
    // Ensure client is ready
    try {
      if (!client.isReady) {
        await client.connect();
      }
    } catch (connectError) {
      // If connect fails, try to get a fresh client
      redisClient = null;
      connectionPromise = null;
      const freshClient = await getRedisClient();
      await freshClient.set(ITEMS_KEY, JSON.stringify(items));
      return;
    }
    
    await client.set(ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving items to Redis:', error);
    // Reset client on error to force reconnection
    redisClient = null;
    connectionPromise = null;
    throw error;
  }
}

export async function getCategoriesFromRedis(): Promise<string[]> {
  try {
    const client = await getRedisClient();
    
    // Ensure client is ready
    try {
      if (!client.isReady) {
        await client.connect();
      }
    } catch (connectError) {
      // If connect fails, try to get a fresh client
      redisClient = null;
      connectionPromise = null;
      const freshClient = await getRedisClient();
      const data = await freshClient.get(CATEGORIES_KEY);
      if (!data) return ['Uncategorized'];
      return JSON.parse(data);
    }
    
    const data = await client.get(CATEGORIES_KEY);
    if (!data) return ['Uncategorized'];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching categories from Redis:', error);
    // Reset client on error to force reconnection
    redisClient = null;
    connectionPromise = null;
    return ['Uncategorized'];
  }
}

export async function saveCategoriesToRedis(categories: string[]): Promise<void> {
  try {
    const client = await getRedisClient();
    
    // Ensure client is ready
    try {
      if (!client.isReady) {
        await client.connect();
      }
    } catch (connectError) {
      // If connect fails, try to get a fresh client
      redisClient = null;
      connectionPromise = null;
      const freshClient = await getRedisClient();
      await freshClient.set(CATEGORIES_KEY, JSON.stringify(categories));
      return;
    }
    
    await client.set(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories to Redis:', error);
    // Reset client on error to force reconnection
    redisClient = null;
    connectionPromise = null;
    throw error;
  }
}
