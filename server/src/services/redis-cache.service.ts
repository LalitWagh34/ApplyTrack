/**
 * Redis Cache & Lock Service
 * Provides in-memory caching for pipeline requests and atomic Mutex locks for Gmail sync debouncing
 */
import Redis from 'ioredis';
import { getRedisOptions } from '../config/bullmq.js';

class RedisCacheService {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    try {
      const options = getRedisOptions();
      this.client = new Redis(options);

      this.client.on('connect', () => {
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        console.warn('[RedisCache] Connection warning (running in graceful fallback):', err.message);
      });
    } catch (err) {
      console.warn('[RedisCache] Failed to initialize Redis client; fallback mode active.');
    }
  }

  /**
   * Retrieves a cached value
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  }

  /**
   * Stores a value in Redis with a time-to-live (TTL in seconds)
   */
  public async set(key: string, value: unknown, ttlSeconds = 180): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Non-blocking fallback
    }
  }

  /**
   * Invalidates one or multiple keys (or prefix pattern)
   */
  public async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch {
      // Non-blocking fallback
    }
  }

  /**
   * Invalidates all cached application queries for a user
   */
  public async invalidateUserApps(userId: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      const pattern = `cache:apps:${userId}:*`;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // Non-blocking fallback
    }
  }

  /**
   * Acquires an atomic lock for a given resource (e.g. Gmail sync debounce)
   * Returns true if lock was acquired, false if already locked
   */
  public async acquireLock(lockKey: string, ttlSeconds = 60): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      // If Redis is temporarily unreachable, allow the request to proceed
      return true;
    }
    try {
      const result = await this.client.set(lockKey, 'locked', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch {
      return true;
    }
  }

  /**
   * Releases an atomic lock manually
   */
  public async releaseLock(lockKey: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(lockKey);
    } catch {
      // Non-blocking fallback
    }
  }
}

export const redisCache = new RedisCacheService();
export default redisCache;
