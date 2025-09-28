import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ErrandHistoryRepository, ErrandHistoryFilters, ErrandHistorySortOptions, PaginationOptions, PaginatedResult } from '../../domain/repositories/errand-history.repository';
import { ErrandHistoryEntity } from '../../domain/entities/errand-history.entity';
import { LocationVO } from '../../domain/value-objects/location.vo';
import { Prisma } from '@prisma/client';

@Injectable()
export class ErrandHistoryRepositoryImpl implements ErrandHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(history: ErrandHistoryEntity): Promise<ErrandHistoryEntity> {
    const data = this.mapEntityToData(history);
    
    if (history.getId()) {
      // Update existing history entry
      const updated = await this.prisma.errandHistory.update({
        where: { id: history.getId() },
        data,
        include: {
          errand: true,
          performer: true,
        },
      });
      return this.mapDataToEntity(updated);
    } else {
      // Create new history entry
      const created = await this.prisma.errandHistory.create({
        data,
        include: {
          errand: true,
          performer: true,
        },
      });
      return this.mapDataToEntity(created);
    }
  }

  async findById(id: string): Promise<ErrandHistoryEntity | null> {
    const history = await this.prisma.errandHistory.findUnique({
      where: { id },
      include: {
        errand: true,
        performer: true,
      },
    });

    return history ? this.mapDataToEntity(history) : null;
  }

  async findMany(options: {
    filters?: ErrandHistoryFilters;
    sort?: ErrandHistorySortOptions;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<ErrandHistoryEntity>> {
    const where = this.buildWhereClause(options.filters);
    const orderBy = this.buildOrderByClause(options.sort);
    const { skip, take } = this.buildPaginationClause(options.pagination);

    const [items, total] = await Promise.all([
      this.prisma.errandHistory.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          errand: true,
          performer: true,
        },
      }),
      this.prisma.errandHistory.count({ where }),
    ]);

    return {
      items: items.map(item => this.mapDataToEntity(item)),
      total,
      page: options.pagination?.page || 1,
      limit: options.pagination?.limit || 10,
    };
  }

  async findByErrandId(errandId: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandHistoryEntity>> {
    return this.findMany({
      filters: { errandId },
      sort: { field: 'timestamp', direction: 'desc' },
      pagination,
    });
  }

  async findByUser(userId: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandHistoryEntity>> {
    return this.findMany({
      filters: { performedBy: userId },
      sort: { field: 'timestamp', direction: 'desc' },
      pagination,
    });
  }

  async findByAction(action: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandHistoryEntity>> {
    return this.findMany({
      filters: { action: [action] },
      sort: { field: 'timestamp', direction: 'desc' },
      pagination,
    });
  }

  async findCritical(pagination?: PaginationOptions): Promise<PaginatedResult<ErrandHistoryEntity>> {
    return this.findMany({
      filters: { isCritical: true },
      sort: { field: 'timestamp', direction: 'desc' },
      pagination,
    });
  }

  async findWithLocation(pagination?: PaginationOptions): Promise<PaginatedResult<ErrandHistoryEntity>> {
    const where: Prisma.ErrandHistoryWhereInput = {
      location: { not: null },
    };

    const { skip, take } = this.buildPaginationClause(pagination);

    const [items, total] = await Promise.all([
      this.prisma.errandHistory.findMany({
        where,
        skip,
        take,
        include: {
          errand: true,
          performer: true,
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.errandHistory.count({ where }),
    ]);

    return {
      items: items.map(item => this.mapDataToEntity(item)),
      total,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
    };
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ErrandHistoryEntity>> {
    return this.findMany({
      filters: { startDate, endDate },
      sort: { field: 'timestamp', direction: 'desc' },
      pagination,
    });
  }

  async getTimeline(errandId: string): Promise<ErrandHistoryEntity[]> {
    const result = await this.findByErrandId(errandId, { page: 1, limit: 1000 });
    return result.items;
  }

  async getLatestEntry(errandId: string): Promise<ErrandHistoryEntity | null> {
    const result = await this.findByErrandId(errandId, { page: 1, limit: 1 });
    return result.items[0] || null;
  }

  async getFirstEntry(errandId: string): Promise<ErrandHistoryEntity | null> {
    const result = await this.findMany({
      filters: { errandId },
      sort: { field: 'timestamp', direction: 'asc' },
      pagination: { page: 1, limit: 1 },
    });
    return result.items[0] || null;
  }

  async getStatusChanges(errandId: string): Promise<ErrandHistoryEntity[]> {
    const result = await this.findMany({
      filters: {
        errandId,
        action: ['status_changed', 'assigned', 'started', 'completed', 'cancelled'],
      },
      sort: { field: 'timestamp', direction: 'asc' },
    });
    return result.items;
  }

  async getUserActivity(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ErrandHistoryEntity[]> {
    const filters: ErrandHistoryFilters = { performedBy: userId };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await this.findMany({
      filters,
      sort: { field: 'timestamp', direction: 'desc' },
    });
    return result.items;
  }

  async getUserStatistics(userId: string): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    recentActivity: ErrandHistoryEntity[];
  }> {
    const [totalActions, actionStats, recentActivity] = await Promise.all([
      this.prisma.errandHistory.count({
        where: { performedBy: userId },
      }),
      this.prisma.errandHistory.groupBy({
        by: ['action'],
        where: { performedBy: userId },
        _count: { action: true },
      }),
      this.getUserActivity(userId),
    ]);

    return {
      totalActions,
      actionsByType: actionStats.reduce((acc, stat) => {
        acc[stat.action] = stat._count.action;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: recentActivity.slice(0, 10),
    };
  }

  async getErrandLifecycleStats(errandId: string): Promise<{
    totalEvents: number;
    duration: number | null;
    statusChanges: number;
    criticalEvents: number;
  }> {
    const [totalEvents, statusChanges, criticalEvents, firstEntry, lastEntry] = await Promise.all([
      this.prisma.errandHistory.count({
        where: { errandId },
      }),
      this.prisma.errandHistory.count({
        where: {
          errandId,
          action: { in: ['status_changed', 'assigned', 'started', 'completed', 'cancelled'] },
        },
      }),
      this.prisma.errandHistory.count({
        where: { errandId, isCritical: true },
      }),
      this.getFirstEntry(errandId),
      this.getLatestEntry(errandId),
    ]);

    const duration = firstEntry && lastEntry
      ? lastEntry.getTimestamp().getTime() - firstEntry.getTimestamp().getTime()
      : null;

    return {
      totalEvents,
      duration,
      statusChanges,
      criticalEvents,
    };
  }

  async getSystemWideActivityStats(startDate?: Date, endDate?: Date): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByHour: Record<string, number>;
    mostActiveUsers: Array<{ userId: string; count: number }>;
  }> {
    const where: Prisma.ErrandHistoryWhereInput = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [totalActions, actionStats, userStats] = await Promise.all([
      this.prisma.errandHistory.count({ where }),
      this.prisma.errandHistory.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      this.prisma.errandHistory.groupBy({
        by: ['performedBy'],
        where,
        _count: { performedBy: true },
        orderBy: { _count: { performedBy: 'desc' } },
        take: 10,
      }),
    ]);

    // For hourly stats, we'd need to use raw SQL or process the data in memory
    // This is a simplified implementation
    const actionsByHour: Record<string, number> = {};

    return {
      totalActions,
      actionsByType: actionStats.reduce((acc, stat) => {
        acc[stat.action] = stat._count.action;
        return acc;
      }, {} as Record<string, number>),
      actionsByHour,
      mostActiveUsers: userStats.map(stat => ({
        userId: stat.performedBy,
        count: stat._count.performedBy,
      })),
    };
  }

  async findRequiringAttention(pagination?: PaginationOptions): Promise<PaginatedResult<ErrandHistoryEntity>> {
    return this.findMany({
      filters: {
        isCritical: true,
        action: ['error', 'timeout', 'failed'],
      },
      sort: { field: 'timestamp', direction: 'desc' },
      pagination,
    });
  }

  async bulkSave(histories: ErrandHistoryEntity[]): Promise<ErrandHistoryEntity[]> {
    const data = histories.map(history => this.mapEntityToData(history));
    
    await this.prisma.errandHistory.createMany({
      data,
      skipDuplicates: true,
    });

    // Return the created entities (simplified - in real implementation you might want to fetch them)
    return histories;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.errandHistory.deleteMany({
      where: {
        timestamp: { lt: date },
        isCritical: false, // Keep critical entries
      },
    });
    return result.count;
  }

  async count(filters?: ErrandHistoryFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.errandHistory.count({ where });
  }

  async hasUserAccess(id: string, userId: string): Promise<boolean> {
    const count = await this.prisma.errandHistory.count({
      where: {
        id,
        OR: [
          { performedBy: userId },
          {
            errand: {
              OR: [
                { createdBy: userId },
                { assignedTo: userId },
              ],
            },
          },
        ],
      },
    });
    return count > 0;
  }

  async getPerformanceMetrics(userId?: string): Promise<{
    averageResponseTime: number;
    completionRate: number;
    errorRate: number;
  }> {
    const where = userId ? { performedBy: userId } : {};

    const [totalActions, completedActions, errorActions] = await Promise.all([
      this.prisma.errandHistory.count({ where }),
      this.prisma.errandHistory.count({
        where: { ...where, action: 'completed' },
      }),
      this.prisma.errandHistory.count({
        where: { ...where, action: { in: ['error', 'failed', 'timeout'] } },
      }),
    ]);

    return {
      averageResponseTime: 0, // Would need more complex calculation
      completionRate: totalActions > 0 ? completedActions / totalActions : 0,
      errorRate: totalActions > 0 ? errorActions / totalActions : 0,
    };
  }

  async findByLocationProximity(
    location: { latitude: number; longitude: number },
    radiusKm: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ErrandHistoryEntity>> {
    // This would require PostGIS or similar spatial database extensions
    // For now, return empty result
    return {
      items: [],
      total: 0,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
    };
  }

  async getAuditTrail(
    errandId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ErrandHistoryEntity[]> {
    const filters: ErrandHistoryFilters = { errandId };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await this.findMany({
      filters,
      sort: { field: 'timestamp', direction: 'asc' },
    });
    return result.items;
  }

  async exportData(
    filters?: ErrandHistoryFilters,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const result = await this.findMany({ filters });
    
    if (format === 'json') {
      return JSON.stringify(result.items.map(item => ({
        id: item.getId(),
        errandId: item.getErrandId(),
        action: item.getAction(),
        description: item.getDescription(),
        performedBy: item.getPerformedBy(),
        timestamp: item.getTimestamp(),
        location: item.getLocation()?.toJSON(),
        metadata: item.getMetadata(),
        isCritical: item.getIsCritical(),
      })), null, 2);
    }

    // CSV format implementation would go here
    return '';
  }

  private mapEntityToData(history: ErrandHistoryEntity): any {
    return {
      id: history.getId(),
      errandId: history.getErrandId(),
      action: history.getAction(),
      description: history.getDescription(),
      performedBy: history.getPerformedBy(),
      timestamp: history.getTimestamp(),
      location: history.getLocation()?.toJSON(),
      metadata: history.getMetadata(),
      isCritical: history.getIsCritical(),
    };
  }

  private mapDataToEntity(data: any): ErrandHistoryEntity {
    const location = data.location
      ? new LocationVO(
          data.location.address,
          data.location.latitude,
          data.location.longitude,
          data.location.instructions,
        )
      : undefined;

    return ErrandHistoryEntity.fromPersistence({
      id: data.id,
      errandId: data.errandId,
      action: data.action,
      description: data.description,
      performedBy: data.performedBy,
      timestamp: data.timestamp,
      location,
      metadata: data.metadata || {},
      isCritical: data.isCritical,
    });
  }

  private buildWhereClause(filters?: ErrandHistoryFilters): Prisma.ErrandHistoryWhereInput {
    if (!filters) return {};

    const where: Prisma.ErrandHistoryWhereInput = {};

    if (filters.errandId) {
      where.errandId = filters.errandId;
    }

    if (filters.performedBy) {
      where.performedBy = filters.performedBy;
    }

    if (filters.action) {
      where.action = { in: filters.action };
    }

    if (filters.isCritical !== undefined) {
      where.isCritical = filters.isCritical;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    return where;
  }

  private buildOrderByClause(sort?: ErrandHistorySortOptions): Prisma.ErrandHistoryOrderByWithRelationInput {
    if (!sort) {
      return { timestamp: 'desc' };
    }

    return {
      [sort.field]: sort.direction,
    };
  }

  private buildPaginationClause(pagination?: PaginationOptions): { skip: number; take: number } {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }
}