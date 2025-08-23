import { Injectable } from '@nestjs/common';
import { UserCacheService } from '../../infrastructure/repositories/user-cache.service';
import { OptimizedPrismaUserRepository } from '../../infrastructure/repositories/optimized-prisma-user.repository';
import { UserRepository } from '../../domain/repositories/user.repository';

/**
 * Service for monitoring repository performance and cache statistics
 */
@Injectable()
export class RepositoryMonitoringService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheService: UserCacheService,
  ) {}

  /**
   * Get cache performance statistics
   */
  getCacheStats() {
    return {
      ...this.cacheService.getStats(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed cache performance metrics
   */
  getDetailedCacheMetrics() {
    const stats = this.cacheService.getStats();
    const hitRatio = this.calculateHitRatio(stats);
    
    return {
      cacheStats: stats,
      performance: {
        hitRatio,
        memoryUsage: this.estimateMemoryUsage(stats),
        efficiency: this.calculateEfficiency(stats),
      },
      recommendations: this.generateRecommendations(stats, hitRatio),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear all caches (for maintenance or testing)
   */
  clearAllCaches(): { success: boolean; message: string } {
    try {
      if (this.userRepository instanceof OptimizedPrismaUserRepository) {
        this.userRepository.clearCache();
        return {
          success: true,
          message: 'All caches cleared successfully',
        };
      } else {
        return {
          success: false,
          message: 'Repository does not support cache clearing',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear caches: ${error.message}`,
      };
    }
  }

  /**
   * Get repository health status
   */
  getRepositoryHealth() {
    const stats = this.cacheService.getStats();
    const isHealthy = this.assessHealth(stats);
    
    return {
      status: isHealthy ? 'healthy' : 'warning',
      cacheSize: stats.totalSize,
      memoryEstimate: this.estimateMemoryUsage(stats),
      recommendations: isHealthy ? [] : this.generateHealthRecommendations(stats),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate cache hit ratio (estimated)
   */
  private calculateHitRatio(stats: any): number {
    // This is a simplified estimation since we don't track hits/misses
    // In a production system, you'd want to implement proper hit/miss tracking
    const totalCacheEntries = stats.totalSize;
    if (totalCacheEntries === 0) return 0;
    
    // Estimate based on cache utilization
    const maxCacheSize = 1000; // From UserCacheService.MAX_CACHE_SIZE
    const utilizationRatio = totalCacheEntries / maxCacheSize;
    
    // Higher utilization suggests more cache hits
    return Math.min(utilizationRatio * 0.8, 0.95); // Cap at 95%
  }

  /**
   * Estimate memory usage of caches
   */
  private estimateMemoryUsage(stats: any): string {
    // Rough estimation: each cached user ~2KB
    const estimatedBytes = stats.totalSize * 2048;
    
    if (estimatedBytes < 1024) {
      return `${estimatedBytes} B`;
    } else if (estimatedBytes < 1024 * 1024) {
      return `${(estimatedBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * Calculate cache efficiency score
   */
  private calculateEfficiency(stats: any): number {
    const hitRatio = this.calculateHitRatio(stats);
    const memoryEfficiency = Math.min(stats.totalSize / 1000, 1); // Normalize to max cache size
    
    // Weighted score: 70% hit ratio, 30% memory efficiency
    return (hitRatio * 0.7 + memoryEfficiency * 0.3) * 100;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(stats: any, hitRatio: number): string[] {
    const recommendations: string[] = [];
    
    if (hitRatio < 0.5) {
      recommendations.push('Consider increasing cache TTL for better hit ratio');
    }
    
    if (stats.totalSize > 800) {
      recommendations.push('Cache is near capacity, consider increasing MAX_CACHE_SIZE');
    }
    
    if (stats.totalSize < 100) {
      recommendations.push('Low cache utilization, verify caching is working correctly');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Cache performance is optimal');
    }
    
    return recommendations;
  }

  /**
   * Assess overall repository health
   */
  private assessHealth(stats: any): boolean {
    // Health criteria
    const isWithinCapacity = stats.totalSize < 900; // 90% of max capacity
    const hasReasonableUtilization = stats.totalSize > 10; // At least some usage
    
    return isWithinCapacity && hasReasonableUtilization;
  }

  /**
   * Generate health-specific recommendations
   */
  private generateHealthRecommendations(stats: any): string[] {
    const recommendations: string[] = [];
    
    if (stats.totalSize >= 900) {
      recommendations.push('Cache is at high capacity, consider clearing or increasing size');
    }
    
    if (stats.totalSize <= 10) {
      recommendations.push('Very low cache utilization, check if caching is enabled');
    }
    
    return recommendations;
  }
}