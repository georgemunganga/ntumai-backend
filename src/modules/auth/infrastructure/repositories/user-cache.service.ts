import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects';

/**
 * In-memory cache service for user data
 * Provides caching layer to reduce database queries for frequently accessed users
 */
@Injectable()
export class UserCacheService {
  private readonly userByIdCache = new Map<string, { user: User; timestamp: number }>();
  private readonly userByEmailCache = new Map<string, { user: User; timestamp: number }>();
  private readonly userByPhoneCache = new Map<string, { user: User; timestamp: number }>();
  private readonly existsCache = new Map<string, { exists: boolean; timestamp: number }>();
  
  // Cache TTL in milliseconds (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;
  
  // Maximum cache size to prevent memory leaks
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Get user by ID from cache
   */
  getUserById(id: string): User | null {
    const cached = this.userByIdCache.get(id);
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.user;
    }
    
    if (cached) {
      this.userByIdCache.delete(id);
    }
    
    return null;
  }

  /**
   * Cache user by ID
   */
  setUserById(id: string, user: User): void {
    this.ensureCacheSize(this.userByIdCache);
    this.userByIdCache.set(id, {
      user,
      timestamp: Date.now(),
    });
  }

  /**
   * Get user by email from cache
   */
  getUserByEmail(email: Email): User | null {
    const cached = this.userByEmailCache.get(email.value);
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.user;
    }
    
    if (cached) {
      this.userByEmailCache.delete(email.value);
    }
    
    return null;
  }

  /**
   * Cache user by email
   */
  setUserByEmail(email: Email, user: User): void {
    this.ensureCacheSize(this.userByEmailCache);
    this.userByEmailCache.set(email.value, {
      user,
      timestamp: Date.now(),
    });
  }

  /**
   * Get user by phone from cache
   */
  getUserByPhone(phone: string): User | null {
    const cached = this.userByPhoneCache.get(phone);
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.user;
    }
    
    if (cached) {
      this.userByPhoneCache.delete(phone);
    }
    
    return null;
  }

  /**
   * Cache user by phone
   */
  setUserByPhone(phone: string, user: User): void {
    this.ensureCacheSize(this.userByPhoneCache);
    this.userByPhoneCache.set(phone, {
      user,
      timestamp: Date.now(),
    });
  }

  /**
   * Get user existence from cache
   */
  getUserExists(email: Email): boolean | null {
    const cached = this.existsCache.get(email.value);
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.exists;
    }
    
    if (cached) {
      this.existsCache.delete(email.value);
    }
    
    return null;
  }

  /**
   * Cache user existence
   */
  setUserExists(email: Email, exists: boolean): void {
    this.ensureCacheSize(this.existsCache);
    this.existsCache.set(email.value, {
      exists,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate all cache entries for a user
   */
  invalidateUser(user: User): void {
    const userData = user.toPersistence();
    
    // Remove from all caches
    this.userByIdCache.delete(userData.id);
    this.userByEmailCache.delete(userData.email);
    if (user.phone) {
      this.userByPhoneCache.delete(user.phone.value);
    }
    this.existsCache.delete(userData.email);
  }

  /**
   * Invalidate user by ID
   */
  invalidateUserById(id: string): void {
    const cached = this.userByIdCache.get(id);
    if (cached) {
      this.invalidateUser(cached.user);
    }
  }

  /**
   * Invalidate user by email
   */
  invalidateUserByEmail(email: Email): void {
    const cached = this.userByEmailCache.get(email.value);
    if (cached) {
      this.invalidateUser(cached.user);
    }
    this.existsCache.delete(email.value);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.userByIdCache.clear();
    this.userByEmailCache.clear();
    this.userByPhoneCache.clear();
    this.existsCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    userByIdSize: number;
    userByEmailSize: number;
    userByPhoneSize: number;
    existsSize: number;
    totalSize: number;
  } {
    return {
      userByIdSize: this.userByIdCache.size,
      userByEmailSize: this.userByEmailCache.size,
      userByPhoneSize: this.userByPhoneCache.size,
      existsSize: this.existsCache.size,
      totalSize: this.userByIdCache.size + this.userByEmailCache.size + 
                 this.userByPhoneCache.size + this.existsCache.size,
    };
  }

  /**
   * Check if cache entry is still valid
   */
  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Ensure cache doesn't exceed maximum size
   */
  private ensureCacheSize<T>(cache: Map<string, T>): void {
    if (cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries (simple LRU-like behavior)
      const keysToDelete = Array.from(cache.keys()).slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.1));
      keysToDelete.forEach(key => cache.delete(key));
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpired(): void {
    const now = Date.now();
    
    // Clean up user by ID cache
    for (const [key, value] of this.userByIdCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.userByIdCache.delete(key);
      }
    }
    
    // Clean up user by email cache
    for (const [key, value] of this.userByEmailCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.userByEmailCache.delete(key);
      }
    }
    
    // Clean up user by phone cache
    for (const [key, value] of this.userByPhoneCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.userByPhoneCache.delete(key);
      }
    }
    
    // Clean up exists cache
    for (const [key, value] of this.existsCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.existsCache.delete(key);
      }
    }
  }
}