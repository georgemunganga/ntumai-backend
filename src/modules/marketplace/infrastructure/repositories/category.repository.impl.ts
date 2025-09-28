import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { Category } from '../../domain/entities/category.entity';
import { Prisma } from '@prisma/client';

export interface CategorySearchFilters {
  name?: string;
  status?: string;
  parentId?: string;
  level?: number;
}

export interface CategoryStats {
  totalProducts: number;
  activeProducts: number;
  totalSubcategories: number;
  averageRating?: number;
}

@Injectable()
export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: this.getCategoryInclude(),
    });

    return category ? this.toDomain(category) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: this.getCategoryInclude(),
    });

    return category ? this.toDomain(category) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const category = await this.prisma.category.findFirst({
      where: { name },
      include: this.getCategoryInclude(),
    });

    return category ? this.toDomain(category) : null;
  }

  async findAll(limit?: number, offset?: number): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      include: this.getCategoryInclude(),
      orderBy: { sortOrder: 'asc' },
      take: limit,
      skip: offset,
    });

    return categories.map(category => this.toDomain(category));
  }

  async findActive(limit?: number, offset?: number): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { status: 'ACTIVE' },
      include: this.getCategoryInclude(),
      orderBy: { sortOrder: 'asc' },
      take: limit,
      skip: offset,
    });

    return categories.map(category => this.toDomain(category));
  }

  async findRootCategories(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { 
        parentId: null,
        status: 'ACTIVE'
      },
      include: this.getCategoryInclude(),
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map(category => this.toDomain(category));
  }

  async findByParentId(parentId: string): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { 
        parentId,
        status: 'ACTIVE'
      },
      include: this.getCategoryInclude(),
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map(category => this.toDomain(category));
  }

  async findByLevel(level: number): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { level },
      include: this.getCategoryInclude(),
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map(category => this.toDomain(category));
  }

  async search(filters: CategorySearchFilters, limit?: number, offset?: number): Promise<Category[]> {
    const where: Prisma.CategoryWhereInput = {};

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    }

    if (filters.level !== undefined) {
      where.level = filters.level;
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: this.getCategoryInclude(),
      orderBy: { sortOrder: 'asc' },
      take: limit,
      skip: offset,
    });

    return categories.map(category => this.toDomain(category));
  }

  async save(category: Category): Promise<Category> {
    const categoryData = this.toPersistence(category);
    
    if (category.getId()) {
      // Update existing category
      const updatedCategory = await this.prisma.category.update({
        where: { id: category.getId() },
        data: {
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description,
          imageUrl: categoryData.imageUrl,
          status: categoryData.status,
          sortOrder: categoryData.sortOrder,
          metaTitle: categoryData.metaTitle,
          metaDescription: categoryData.metaDescription,
          updatedAt: new Date(),
        },
        include: this.getCategoryInclude(),
      });
      return this.toDomain(updatedCategory);
    } else {
      // Create new category
      const createdCategory = await this.prisma.category.create({
        data: categoryData,
        include: this.getCategoryInclude(),
      });
      return this.toDomain(createdCategory);
    }
  }

  async delete(id: string): Promise<void> {
    // Check if category has subcategories or products
    const [subcategoriesCount, productsCount] = await Promise.all([
      this.prisma.category.count({ where: { parentId: id } }),
      this.prisma.product.count({ where: { categoryId: id } }),
    ]);

    if (subcategoriesCount > 0 || productsCount > 0) {
      throw new Error('Cannot delete category with subcategories or products');
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: {
        status: status as any,
        updatedAt: new Date(),
      },
    });
  }

  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: {
        sortOrder,
        updatedAt: new Date(),
      },
    });
  }

  async moveCategory(id: string, newParentId: string | null): Promise<void> {
    // Calculate new level
    let newLevel = 0;
    if (newParentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: newParentId },
        select: { level: true },
      });
      if (parent) {
        newLevel = parent.level + 1;
      }
    }

    await this.prisma.category.update({
      where: { id },
      data: {
        parentId: newParentId,
        level: newLevel,
        updatedAt: new Date(),
      },
    });

    // Update levels of all descendants
    await this.updateDescendantLevels(id, newLevel);
  }

  async getStats(id: string): Promise<CategoryStats> {
    const [totalProducts, activeProducts, totalSubcategories, avgRating] = await Promise.all([
      this.prisma.product.count({
        where: { categoryId: id },
      }),
      this.prisma.product.count({
        where: {
          categoryId: id,
          status: 'ACTIVE',
        },
      }),
      this.prisma.category.count({
        where: { parentId: id },
      }),
      this.prisma.product.aggregate({
        where: { categoryId: id },
        _avg: { averageRating: true },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      totalSubcategories,
      averageRating: avgRating._avg.averageRating || undefined,
    };
  }

  async getCategoryHierarchy(rootId?: string): Promise<Category[]> {
    const where: Prisma.CategoryWhereInput = {
      status: 'ACTIVE',
    };

    if (rootId) {
      where.OR = [
        { id: rootId },
        { parentId: rootId },
      ];
    } else {
      where.parentId = null;
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        ...this.getCategoryInclude(),
        subcategories: {
          where: { status: 'ACTIVE' },
          include: this.getCategoryInclude(),
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map(category => this.toDomain(category));
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<void> {
    await this.prisma.category.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: status as any,
        updatedAt: new Date(),
      },
    });
  }

  async reorderCategories(parentId: string | null, categoryOrders: Array<{ id: string; sortOrder: number }>): Promise<void> {
    const updates = categoryOrders.map(({ id, sortOrder }) =>
      this.prisma.category.update({
        where: { id },
        data: {
          sortOrder,
          updatedAt: new Date(),
        },
      })
    );

    await Promise.all(updates);
  }

  private async updateDescendantLevels(parentId: string, parentLevel: number): Promise<void> {
    const children = await this.prisma.category.findMany({
      where: { parentId },
      select: { id: true },
    });

    if (children.length > 0) {
      const newLevel = parentLevel + 1;
      
      await this.prisma.category.updateMany({
        where: {
          id: { in: children.map(c => c.id) },
        },
        data: {
          level: newLevel,
          updatedAt: new Date(),
        },
      });

      // Recursively update grandchildren
      for (const child of children) {
        await this.updateDescendantLevels(child.id, newLevel);
      }
    }
  }

  private getCategoryInclude() {
    return {
      parent: true,
      subcategories: {
        where: { status: 'ACTIVE' },
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: {
          products: true,
          subcategories: true,
        },
      },
    };
  }

  private toDomain(category: any): Category {
    return new Category(
      category.id,
      category.name,
      category.slug,
      category.description,
      category.imageUrl,
      category.parentId,
      category.level,
      category.sortOrder,
      category.status,
      category.metaTitle,
      category.metaDescription,
      category.createdAt,
      category.updatedAt,
      category.subcategories?.map((sub: any) => this.toDomain(sub)) || [],
      category._count?.products || 0
    );
  }

  private toPersistence(category: Category): Prisma.CategoryCreateInput {
    const data: Prisma.CategoryCreateInput = {
      id: category.getId(),
      name: category.getName(),
      slug: category.getSlug(),
      description: category.getDescription(),
      imageUrl: category.getImageUrl(),
      level: category.getLevel(),
      sortOrder: category.getSortOrder(),
      status: category.getStatus() as any,
      metaTitle: category.getMetaTitle(),
      metaDescription: category.getMetaDescription(),
      createdAt: category.getCreatedAt(),
      updatedAt: category.getUpdatedAt(),
    };

    if (category.getParentId()) {
      data.parent = { connect: { id: category.getParentId() } };
    }

    return data;
  }
}