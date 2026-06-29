import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from './logger';

interface RedisClientType {
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: any): Promise<string | null>;
  del(key: string): Promise<number>;
  quit(): Promise<void>;
  on(event: string, callback: (...args: any[]) => void): void;
}

// In-Memory Mock Fallback for Redis
class MockRedisClient implements RedisClientType {
  private store = new Map<string, string>();

  async connect(): Promise<void> {
    logger.warn('⚠️ Using in-memory mock Redis client.');
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, options?: any): Promise<string | null> {
    this.store.set(key, value);
    if (options?.EX) {
      setTimeout(() => {
        this.store.delete(key);
      }, options.EX * 1000);
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key);
    return deleted ? 1 : 0;
  }

  async quit(): Promise<void> {
    this.store.clear();
  }

  on(event: string, _callback: (...args: any[]) => void): void {
    logger.debug(`MockRedis on event: ${event}`);
  }
}

let redisClient: RedisClientType;

if (env.REDIS_URL) {
  const client = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries >= 2) {
          // End reconnection attempts, allowing the connect() call to reject and swap to Mock
          return false;
        }
        return 500; // Retry after 500ms
      }
    }
  });
  
  client.on('error', (err) => {
    // Only log error if we are not falling back
    if (!(redisClient instanceof MockRedisClient)) {
      logger.error('❌ Redis Client Error:', err);
    }
  });

  client.on('connect', () => {
    logger.info('🔌 Connected to Redis cache successfully.');
  });

  redisClient = {
    connect: async () => {
      try {
        await client.connect();
      } catch (err) {
        logger.warn('⚠️ Failed to connect to Redis. Swapping to Mock Redis.');
        redisClient = new MockRedisClient();
        await redisClient.connect();
      }
    },
    get: async (key: string) => {
      if (redisClient instanceof MockRedisClient) return redisClient.get(key);
      return client.get(key);
    },
    set: async (key: string, value: string, options?: any) => {
      if (redisClient instanceof MockRedisClient) return redisClient.set(key, value, options);
      if (options?.EX) {
        return client.set(key, value, { EX: options.EX });
      }
      return client.set(key, value);
    },
    del: async (key: string) => {
      if (redisClient instanceof MockRedisClient) return redisClient.del(key);
      return client.del(key);
    },
    quit: async () => {
      if (redisClient instanceof MockRedisClient) return redisClient.quit();
      await client.quit();
    },
    on: (event: string, callback: (...args: any[]) => void) => {
      if (!(redisClient instanceof MockRedisClient)) {
        client.on(event, callback);
      }
    }
  };
} else {
  redisClient = new MockRedisClient();
}

export { redisClient };
