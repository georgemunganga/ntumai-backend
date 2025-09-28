import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ErrandTemplateRepository, ErrandTemplateFilters, ErrandTemplateSortOptions, PaginationOptions, PaginatedResult } from '../../domain/repositories/errand-template.repository';
import { ErrandTemplateEntity } from '../../domain/entities/errand-template.entity';
import { LocationVO } from '../../domain/value-objects/location.vo';
import { PriorityVO } from '../../domain/value-objects/priority.vo';
import { Prisma } from '@prisma/client';

@Injectable()
export class ErrandTemplateRepositoryImpl implements ErrandTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(template: ErrandTemplateEntity): Promise<ErrandTemplateEntity> {
    const data = this.mapEntityToData(template);
    
    if (template.getId()) {
      // Update existing template
      const updated = await this.prisma.errandTemplate.update({
        where: { id: template.getId() },
        data,
        include: {
          creator: true,
        },
      });
      return this.mapDataToEntity(updated);
    } else {
      // Create new template
      const created = await this.prisma.errandTemplate.create({
        data,
        include: {
          creator: true,
        },
      });
      return this.mapDataToEntity(created);
    }
  }

  async findById(id: string): Promise<ErrandTemplateEntity | null> {
    const template = await this.prisma.errandTemplate.findUnique({
      where: { id },
      include: {
        creator: true,
      },
    });

    return template ? this.mapDataToEntity(template) : null;
  }

  async findMany(options: {
    filters?: ErrandTemplateFilters;
    sort?: ErrandTemplateSortOptions;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<ErrandTemplateEntity>> {
    const where = this.buildWhereClause(options.filters);
    const orderBy = this.buildOrderByClause(options.sort);
    const { skip, take } = this.buildPaginationClause(options.pagination);

    const [items, total] = await Promise.all([
      this.prisma.errandTemplate.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          creator: true,
        },
      }),
      this.prisma.errandTemplate.count({ where }),
    ]);

    return {
      items: items.map(item => this.mapDataToEntity(item)),
      total,
      page: options.pagination?.page || 1,
      limit: options.pagination?.limit || 10,
    };
  }

  async findByCreatedBy(createdBy: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandTemplateEntity>> {
    return this.findMany({
      filters: { createdBy },
      pagination,
    });
  }

  async findActive(pagination?: PaginationOptions): Promise<PaginatedResult<ErrandTemplateEntity>> {
    return this.findMany({
      filters: { isActive: true },
      pagination,
    });
  }

  async findByCategory(category: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandTemplateEntity>> {
    return this.findMany({
      filters: { category: [category] },
      pagination,
    });
  }

  async findByTags(tags: string[], pagination?: PaginationOptions): Promise<PaginatedResult<ErrandTemplateEntity>> {
    return this.findMany({
      filters: { tags },
      pagination,
    });
  }

  async findPublic(pagination?: PaginationOptions): Promise<PaginatedResult<ErrandTemplateEntity>> {
    return this.findMany({
      filters: { isPublic: true, isActive: true },
      sort: { field: 'usageCount', direction: 'desc' },
      pagination,
    });
  }

  async findAccessibleByUser(userId: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandTemplateEntity>> {
    return this.findMany({
      filters: {
        OR: [
          { createdBy: userId },
          { isPublic: true, isActive: true },
        ],
      },
      pagination,
    });
  }

  async findMostUsed(limit: number = 10): Promise<ErrandTemplateEntity[]> {
    const result = await this.findMany({
      filters: { isActive: true },
      sort: { field: 'usageCount', direction: 'desc' },
      pagination: { page: 1, limit },
    });
    return result.items;
  }

  async findRecent(limit: number = 10): Promise<ErrandTemplateEntity[]> {
    const result = await this.findMany({
      filters: { isActive: true },
      sort: { field: 'createdAt', direction: 'desc' },
      pagination: { page: 1, limit },
    });
    return result.items;
  }

  async findByName(name: string): Promise<ErrandTemplateEntity | null> {
    const template = await this.prisma.errandTemplate.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
      include: {
        creator: true,
      },
    });

    return template ? this.mapDataToEntity(template) : null;
  }

  async search(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<ErrandTemplateEntity>> {
    const where: Prisma.ErrandTemplateWhereInput = {
      AND: [
        { isActive: true },
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
        },
      ],
    };

    const { skip, take } = this.buildPaginationClause(pagination);

    const [items, total] = await Promise.all([
      this.prisma.errandTemplate.findMany({
        where,
        skip,
        take,
        include: {
          creator: true,
        },
        orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.errandTemplate.count({ where }),
    ]);

    return {
      items: items.map(item => this.mapDataToEntity(item)),
      total,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
    };
  }

  async update(id: string, data: Partial<ErrandTemplateEntity>): Promise<ErrandTemplateEntity> {
    const updateData = this.mapEntityToData(data as ErrandTemplateEntity);
    const updated = await this.prisma.errandTemplate.update({
      where: { id },
      data: updateData,
      include: {
        creator: true,
      },
    });
    return this.mapDataToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.errandTemplate.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.errandTemplate.count({
      where: { id },
    });
    return count > 0;
  }

  async hasUserAccess(id: string, userId: string): Promise<boolean> {
    const count = await this.prisma.errandTemplate.count({
      where: {
        id,
        OR: [
          { createdBy: userId },
          { isPublic: true },
        ],
      },
    });
    return count > 0;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.prisma.errandTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
        lastUsedAt: new Date(),
      },
    });
  }

  async getStatistics(userId?: string): Promise<{
    total: number;
    active: number;
    public: number;
    byCategory: Record<string, number>;
    totalUsage: number;
  }> {
    const where = userId ? { createdBy: userId } : {};

    const [total, active, publicTemplates, categoryStats, usageStats] = await Promise.all([
      this.prisma.errandTemplate.count({ where }),
      this.prisma.errandTemplate.count({ where: { ...where, isActive: true } }),
      this.prisma.errandTemplate.count({ where: { ...where, isPublic: true } }),
      this.prisma.errandTemplate.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
      }),
      this.prisma.errandTemplate.aggregate({
        where,
        _sum: { usageCount: true },
      }),
    ]);

    return {
      total,
      active,
      public: publicTemplates,
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat.category] = stat._count.category;
        return acc;
      }, {} as Record<string, number>),
      totalUsage: usageStats._sum.usageCount || 0,
    };
  }

  async getCategories(): Promise<string[]> {
    const result = await this.prisma.errandTemplate.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return result.map(item => item.category);
  }

  async getTags(): Promise<string[]> {
    const result = await this.prisma.errandTemplate.findMany({
      where: { isActive: true },
      select: { tags: true },
    });

    const allTags = result.flatMap(item => item.tags);
    return [...new Set(allTags)];
  }

  async getPopularCategories(limit: number = 10): Promise<Array<{ category: string; count: number }>> {
    const result = await this.prisma.errandTemplate.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: limit,
    });

    return result.map(item => ({
      category: item.category,
      count: item._count.category,
    }));
  }

  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    // This is a simplified implementation. In a real scenario, you might want to use a separate tags table
    const templates = await this.prisma.errandTemplate.findMany({
      where: { isActive: true },
      select: { tags: true },
    });

    const tagCounts = new Map<string, number>();
    templates.forEach(template => {
      template.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async findSimilar(templateId: string, limit: number = 5): Promise<ErrandTemplateEntity[]> {
    const template = await this.prisma.errandTemplate.findUnique({
      where: { id: templateId },
      select: { category: true, tags: true },
    });

    if (!template) return [];

    const similar = await this.prisma.errandTemplate.findMany({
      where: {
        AND: [
          { id: { not: templateId } },
          { isActive: true },
          {
            OR: [
              { category: template.category },
              { tags: { hasSome: template.tags } },
            ],
          },
        ],
      },
      include: {
        creator: true,
      },
      orderBy: { usageCount: 'desc' },
      take: limit,
    });

    return similar.map(item => this.mapDataToEntity(item));
  }

  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<number> {
    const result = await this.prisma.errandTemplate.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });
    return result.count;
  }

  async getPriceRange(): Promise<{ min: number; max: number }> {
    const result = await this.prisma.errandTemplate.aggregate({
      where: { isActive: true },
      _min: { defaultPrice: true },
      _max: { defaultPrice: true },
    });

    return {
      min: result._min.defaultPrice || 0,
      max: result._max.defaultPrice || 0,
    };
  }

  async getDurationRange(): Promise<{ min: number; max: number }> {
    const result = await this.prisma.errandTemplate.aggregate({
      where: { isActive: true },
      _min: { estimatedDuration: true },
      _max: { estimatedDuration: true },
    });

    return {
      min: result._min.estimatedDuration || 0,
      max: result._max.estimatedDuration || 0,
    };
  }

  async isNameUnique(name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ErrandTemplateWhereInput = {
      name: { equals: name, mode: 'insensitive' },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.errandTemplate.count({ where });
    return count === 0;
  }

  private mapEntityToData(template: ErrandTemplateEntity): any {
    return {
      id: template.getId(),
      name: template.getName(),
      description: template.getDescription(),
      category: template.getCategory(),
      tags: template.getTags(),
      requirements: template.getRequirements(),
      defaultPickupLocation: template.getDefaultPickupLocation()?.toJSON(),
      defaultDropoffLocation: template.getDefaultDropoffLocation()?.toJSON(),
      defaultPrice: template.getDefaultPrice(),
      defaultPriority: template.getDefaultPriority().getValue(),
      estimatedDuration: template.getEstimatedDuration(),
      isPublic: template.getIsPublic(),
      isActive: template.getIsActive(),
      usageCount: template.getUsageCount(),
      lastUsedAt: template.getLastUsedAt(),
      createdBy: template.getCreatedBy(),
      createdAt: template.getCreatedAt(),
      updatedAt: template.getUpdatedAt(),
    };
  }

  private mapDataToEntity(data: any): ErrandTemplateEntity {
    const defaultPickupLocation = data.defaultPickupLocation
      ? new LocationVO(
          data.defaultPickupLocation.address,
          data.defaultPickupLocation.latitude,
          data.defaultPickupLocation.longitude,
          data.defaultPickupLocation.instructions,
        )
      : undefined;

    const defaultDropoffLocation = data.defaultDropoffLocation
      ? new LocationVO(
          data.defaultDropoffLocation.address,
          data.defaultDropoffLocation.latitude,
          data.defaultDropoffLocation.longitude,
          data.defaultDropoffLocation.instructions,
        )
      : undefined;

    const defaultPriority = new PriorityVO(data.defaultPriority);

    return ErrandTemplateEntity.fromPersistence({
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      requirements: data.requirements || [],
      defaultPickupLocation,
      defaultDropoffLocation,
      defaultPrice: data.defaultPrice,
      defaultPriority,
      estimatedDuration: data.estimatedDuration,
      isPublic: data.isPublic,
      isActive: data.isActive,
      usageCount: data.usageCount,
      lastUsedAt: data.lastUsedAt,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private buildWhereClause(filters?: ErrandTemplateFilters): Prisma.ErrandTemplateWhereInput {
    if (!filters) return {};

    const where: Prisma.ErrandTemplateWhereInput = {};

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters.category) {
      where.category = { in: filters.category };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.defaultPrice = {};
      if (filters.minPrice !== undefined) {
        where.defaultPrice.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.defaultPrice.lte = filters.maxPrice;
      }
    }

    if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
      where.estimatedDuration = {};
      if (filters.minDuration !== undefined) {
        where.estimatedDuration.gte = filters.minDuration;
      }
      if (filters.maxDuration !== undefined) {
        where.estimatedDuration.lte = filters.maxDuration;
      }
    }

    if (filters.OR) {
      where.OR = filters.OR.map(orFilter => this.buildWhereClause(orFilter));
    }

    return where;
  }

  private buildOrderByClause(sort?: ErrandTemplateSortOptions): Prisma.ErrandTemplateOrderByWithRelationInput {
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