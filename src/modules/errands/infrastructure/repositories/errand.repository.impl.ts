import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ErrandRepository, ErrandFilters, ErrandSortOptions, PaginationOptions, PaginatedResult } from '../../domain/repositories/errand.repository';
import { ErrandEntity } from '../../domain/entities/errand.entity';
import { LocationVO } from '../../domain/value-objects/location.vo';
import { PriorityVO } from '../../domain/value-objects/priority.vo';
import { ErrandStatusVO } from '../../domain/value-objects/errand-status.vo';
import { ProofVO } from '../../domain/value-objects/proof-type.vo';
import { Prisma } from '@prisma/client';

@Injectable()
export class ErrandRepositoryImpl implements ErrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(errand: ErrandEntity): Promise<ErrandEntity> {
    const data = this.mapEntityToData(errand);
    
    if (errand.getId()) {
      // Update existing errand
      const updated = await this.prisma.errand.update({
        where: { id: errand.getId() },
        data,
        include: {
          proofs: true,
          creator: true,
          assignedDriver: true,
        },
      });
      return this.mapDataToEntity(updated);
    } else {
      // Create new errand
      const created = await this.prisma.errand.create({
        data,
        include: {
          proofs: true,
          creator: true,
          assignedDriver: true,
        },
      });
      return this.mapDataToEntity(created);
    }
  }

  async findById(id: string): Promise<ErrandEntity | null> {
    const errand = await this.prisma.errand.findUnique({
      where: { id },
      include: {
        proofs: true,
        creator: true,
        assignedDriver: true,
      },
    });

    return errand ? this.mapDataToEntity(errand) : null;
  }

  async findMany(options: {
    filters?: ErrandFilters;
    sort?: ErrandSortOptions;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<ErrandEntity>> {
    const where = this.buildWhereClause(options.filters);
    const orderBy = this.buildOrderByClause(options.sort);
    const { skip, take } = this.buildPaginationClause(options.pagination);

    const [items, total] = await Promise.all([
      this.prisma.errand.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          proofs: true,
          creator: true,
          assignedDriver: true,
        },
      }),
      this.prisma.errand.count({ where }),
    ]);

    return {
      items: items.map(item => this.mapDataToEntity(item)),
      total,
      page: options.pagination?.page || 1,
      limit: options.pagination?.limit || 10,
    };
  }

  async findByUserId(userId: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandEntity>> {
    return this.findMany({
      filters: { userId },
      pagination,
    });
  }

  async findByCreatedBy(createdBy: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandEntity>> {
    return this.findMany({
      filters: { createdBy },
      pagination,
    });
  }

  async findByAssignedTo(assignedTo: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandEntity>> {
    return this.findMany({
      filters: { assignedTo },
      pagination,
    });
  }

  async findAvailable(
    location?: { latitude: number; longitude: number; radius: number },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ErrandEntity>> {
    const filters: ErrandFilters = {
      status: ['pending'],
      location,
    };

    return this.findMany({
      filters,
      sort: { field: 'createdAt', direction: 'desc' },
      pagination,
    });
  }

  async findByLocation(
    location: { latitude: number; longitude: number; radius: number },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ErrandEntity>> {
    return this.findMany({
      filters: { location },
      pagination,
    });
  }

  async findOverdue(pagination?: PaginationOptions): Promise<PaginatedResult<ErrandEntity>> {
    const now = new Date();
    return this.findMany({
      filters: {
        status: ['pending', 'assigned', 'in_progress'],
        endDate: now,
      },
      pagination,
    });
  }

  async findRequiringAttention(pagination?: PaginationOptions): Promise<PaginatedResult<ErrandEntity>> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.findMany({
      filters: {
        status: ['in_progress'],
        startDate: oneDayAgo,
      },
      pagination,
    });
  }

  async findRecent(limit: number = 10): Promise<ErrandEntity[]> {
    const result = await this.findMany({
      sort: { field: 'createdAt', direction: 'desc' },
      pagination: { page: 1, limit },
    });
    return result.items;
  }

  async findByCategory(category: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandEntity>> {
    return this.findMany({
      filters: { category: [category] },
      pagination,
    });
  }

  async countByStatus(status: string): Promise<number> {
    return this.prisma.errand.count({
      where: { status },
    });
  }

  async countByPriority(priority: string): Promise<number> {
    return this.prisma.errand.count({
      where: { priority },
    });
  }

  async getStatistics(userId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const where = userId ? { OR: [{ createdBy: userId }, { assignedTo: userId }] } : {};

    const [total, statusStats, priorityStats, categoryStats] = await Promise.all([
      this.prisma.errand.count({ where }),
      this.prisma.errand.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.errand.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true },
      }),
      this.prisma.errand.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
      }),
    ]);

    return {
      total,
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = stat._count.priority;
        return acc;
      }, {} as Record<string, number>),
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat.category] = stat._count.category;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async search(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandEntity>> {
    const where: Prisma.ErrandWhereInput = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ],
    };

    const { skip, take } = this.buildPaginationClause(pagination);

    const [items, total] = await Promise.all([
      this.prisma.errand.findMany({
        where,
        skip,
        take,
        include: {
          proofs: true,
          creator: true,
          assignedDriver: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.errand.count({ where }),
    ]);

    return {
      items: items.map(item => this.mapDataToEntity(item)),
      total,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
    };
  }

  async update(id: string, data: Partial<ErrandEntity>): Promise<ErrandEntity> {
    const updateData = this.mapEntityToData(data as ErrandEntity);
    const updated = await this.prisma.errand.update({
      where: { id },
      data: updateData,
      include: {
        proofs: true,
        creator: true,
        assignedDriver: true,
      },
    });
    return this.mapDataToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.errand.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.errand.count({
      where: { id },
    });
    return count > 0;
  }

  async hasUserAccess(id: string, userId: string): Promise<boolean> {
    const count = await this.prisma.errand.count({
      where: {
        id,
        OR: [
          { createdBy: userId },
          { assignedTo: userId },
        ],
      },
    });
    return count > 0;
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<number> {
    const result = await this.prisma.errand.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return result.count;
  }

  async getPopularCategories(limit: number = 10): Promise<Array<{ category: string; count: number }>> {
    const result = await this.prisma.errand.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: limit,
    });

    return result.map(item => ({
      category: item.category,
      count: item._count.category,
    }));
  }

  private mapEntityToData(errand: ErrandEntity): any {
    return {
      id: errand.getId(),
      title: errand.getTitle(),
      description: errand.getDescription(),
      category: errand.getCategory(),
      requirements: errand.getRequirements(),
      pickupLocation: errand.getPickupLocation().toJSON(),
      dropoffLocation: errand.getDropoffLocation().toJSON(),
      startLocation: errand.getStartLocation()?.toJSON(),
      completionLocation: errand.getCompletionLocation()?.toJSON(),
      price: errand.getPrice(),
      priority: errand.getPriority().getValue(),
      deadline: errand.getDeadline(),
      estimatedDuration: errand.getEstimatedDuration(),
      status: errand.getStatus().getValue(),
      assignedTo: errand.getAssignedTo(),
      startedAt: errand.getStartedAt(),
      completedAt: errand.getCompletedAt(),
      cancelledAt: errand.getCancelledAt(),
      cancelledBy: errand.getCancelledBy(),
      cancellationReason: errand.getCancellationReason(),
      completionNotes: errand.getCompletionNotes(),
      refundRequested: errand.getRefundRequested(),
      createdBy: errand.getCreatedBy(),
      createdAt: errand.getCreatedAt(),
      updatedAt: errand.getUpdatedAt(),
    };
  }

  private mapDataToEntity(data: any): ErrandEntity {
    const pickupLocation = new LocationVO(
      data.pickupLocation.address,
      data.pickupLocation.latitude,
      data.pickupLocation.longitude,
      data.pickupLocation.instructions,
    );

    const dropoffLocation = new LocationVO(
      data.dropoffLocation.address,
      data.dropoffLocation.latitude,
      data.dropoffLocation.longitude,
      data.dropoffLocation.instructions,
    );

    const startLocation = data.startLocation
      ? new LocationVO(
          data.startLocation.address,
          data.startLocation.latitude,
          data.startLocation.longitude,
          data.startLocation.instructions,
        )
      : undefined;

    const completionLocation = data.completionLocation
      ? new LocationVO(
          data.completionLocation.address,
          data.completionLocation.latitude,
          data.completionLocation.longitude,
          data.completionLocation.instructions,
        )
      : undefined;

    const priority = new PriorityVO(data.priority);
    const status = new ErrandStatusVO(data.status);

    const proofs = data.proofs?.map((proof: any) => 
      new ProofVO(proof.type, proof.url, proof.description)
    ) || [];

    return ErrandEntity.fromPersistence({
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      requirements: data.requirements || [],
      pickupLocation,
      dropoffLocation,
      startLocation,
      completionLocation,
      price: data.price,
      priority,
      deadline: data.deadline,
      estimatedDuration: data.estimatedDuration,
      status,
      assignedTo: data.assignedTo,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      cancelledAt: data.cancelledAt,
      cancelledBy: data.cancelledBy,
      cancellationReason: data.cancellationReason,
      completionNotes: data.completionNotes,
      refundRequested: data.refundRequested,
      proofs,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private buildWhereClause(filters?: ErrandFilters): Prisma.ErrandWhereInput {
    if (!filters) return {};

    const where: Prisma.ErrandWhereInput = {};

    if (filters.status) {
      where.status = { in: filters.status };
    }

    if (filters.priority) {
      where.priority = { in: filters.priority };
    }

    if (filters.category) {
      where.category = { in: filters.category };
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.userId) {
      where.OR = [
        { createdBy: filters.userId },
        { assignedTo: filters.userId },
      ];
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Note: Location-based filtering would require PostGIS or similar spatial database extensions
    // For now, we'll skip the location filter implementation

    return where;
  }

  private buildOrderByClause(sort?: ErrandSortOptions): Prisma.ErrandOrderByWithRelationInput {
    if (!sort) {
      return { createdAt: 'desc' };
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