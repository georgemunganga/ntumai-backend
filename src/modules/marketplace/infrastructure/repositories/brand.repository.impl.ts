import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { BrandRepository } from '../../domain/repositories/brand.repository';
import { Brand } from '../../domain/entities/brand.entity';
import { Prisma } from '@prisma/client';

export interface BrandSearchFilters {
  name?: string;
  status?: string;
  featured?: boolean;
}

export interface BrandStats {
  totalProducts: number;
  activeProducts: number;
  averageRating?: number;
  totalSales?: number;
}

@Injectable()
export class BrandRepositoryImpl implements BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Brand | null> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: this.getBrandInclude(),
    });

    return brand ? this.toDomain(brand) : null;
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
      include: this.getBrandInclude(),
    });

    return brand ? this.toDomain(brand) : null;
  }

  async findByName(name: string): Promise<Brand | null> {
    const brand = await this.prisma.brand.findFirst({
      where: { name },
      include: this.getBrandInclude(),
    });

    return brand ? this.toDomain(brand) : null;
  }

  async findAll(limit?: number, offset?: number): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      include: this.getBrandInclude(),
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    });

    return brands.map(brand => this.toDomain(brand));
  }

  async findActive(limit?: number, offset?: number): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      include: this.getBrandInclude(),
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    });

    return brands.map(brand => this.toDomain(brand));
  }

  async findFeatured(limit?: number): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        status: 'ACTIVE',
        featured: true,
      },
      include: this.getBrandInclude(),
      orderBy: { name: 'asc' },
      take: limit,
    });

    return brands.map(brand => this.toDomain(brand));
  }

  async search(filters: BrandSearchFilters, limit?: number, offset?: number): Promise<Brand[]> {
    const where: Prisma.BrandWhereInput = {};

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }

    const brands = await this.prisma.brand.findMany({
      where,
      include: this.getBrandInclude(),
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    });

    return brands.map(brand => this.toDomain(brand));
  }

  async save(brand: Brand): Promise<Brand> {
    const brandData = this.toPersistence(brand);
    
    if (brand.getId()) {
      // Update existing brand
      const updatedBrand = await this.prisma.brand.update({
        where: { id: brand.getId() },
        data: {
          name: brandData.name,
          slug: brandData.slug,
          description: brandData.description,
          logoUrl: brandData.logoUrl,
          websiteUrl: brandData.websiteUrl,
          status: brandData.status,
          featured: brandData.featured,
          metaTitle: brandData.metaTitle,
          metaDescription: brandData.metaDescription,
          updatedAt: new Date(),
        },
        include: this.getBrandInclude(),
      });
      return this.toDomain(updatedBrand);
    } else {
      // Create new brand
      const createdBrand = await this.prisma.brand.create({
        data: brandData,
        include: this.getBrandInclude(),
      });
      return this.toDomain(createdBrand);
    }
  }

  async delete(id: string): Promise<void> {
    // Check if brand has products
    const productsCount = await this.prisma.product.count({
      where: { brandId: id },
    });

    if (productsCount > 0) {
      throw new Error('Cannot delete brand with associated products');
    }

    await this.prisma.brand.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.prisma.brand.update({
      where: { id },
      data: {
        status: status as any,
        updatedAt: new Date(),
      },
    });
  }

  async updateFeatured(id: string, featured: boolean): Promise<void> {
    await this.prisma.brand.update({
      where: { id },
      data: {
        featured,
        updatedAt: new Date(),
      },
    });
  }

  async getStats(id: string): Promise<BrandStats> {
    const [totalProducts, activeProducts, avgRating, salesData] = await Promise.all([
      this.prisma.product.count({
        where: { brandId: id },
      }),
      this.prisma.product.count({
        where: {
          brandId: id,
          status: 'ACTIVE',
        },
      }),
      this.prisma.product.aggregate({
        where: { brandId: id },
        _avg: { averageRating: true },
      }),
      this.prisma.orderItem.aggregate({
        where: {
          product: {
            brandId: id,
          },
        },
        _sum: {
          quantity: true,
          subtotal: true,
        },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      averageRating: avgRating._avg.averageRating || undefined,
      totalSales: salesData._sum.subtotal || 0,
    };
  }

  async getTopBrands(limit: number = 10): Promise<Array<Brand & { productCount: number; totalSales: number }>> {
    const topBrands = await this.prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      include: {
        ...this.getBrandInclude(),
        products: {
          include: {
            orderItems: {
              select: {
                quantity: true,
                subtotal: true,
              },
            },
          },
        },
      },
      take: limit,
    });

    return topBrands
      .map(brand => {
        const productCount = brand.products.length;
        const totalSales = brand.products.reduce((sum, product) => {
          return sum + product.orderItems.reduce((itemSum, item) => itemSum + item.subtotal, 0);
        }, 0);

        return {
          ...this.toDomain(brand),
          productCount,
          totalSales,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit);
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<void> {
    await this.prisma.brand.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: status as any,
        updatedAt: new Date(),
      },
    });
  }

  async bulkUpdateFeatured(ids: string[], featured: boolean): Promise<void> {
    await this.prisma.brand.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        featured,
        updatedAt: new Date(),
      },
    });
  }

  async getBrandsByCategory(categoryId: string): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        status: 'ACTIVE',
        products: {
          some: {
            categoryId,
            status: 'ACTIVE',
          },
        },
      },
      include: this.getBrandInclude(),
      orderBy: { name: 'asc' },
    });

    return brands.map(brand => this.toDomain(brand));
  }

  async searchByName(query: string, limit: number = 10): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        status: 'ACTIVE',
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: this.getBrandInclude(),
      orderBy: { name: 'asc' },
      take: limit,
    });

    return brands.map(brand => this.toDomain(brand));
  }

  private getBrandInclude() {
    return {
      _count: {
        select: {
          products: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      },
    };
  }

  private toDomain(brand: any): Brand {
    return new Brand(
      brand.id,
      brand.name,
      brand.slug,
      brand.description,
      brand.logoUrl,
      brand.websiteUrl,
      brand.status,
      brand.featured,
      brand.metaTitle,
      brand.metaDescription,
      brand.createdAt,
      brand.updatedAt,
      brand._count?.products || 0
    );
  }

  private toPersistence(brand: Brand): Prisma.BrandCreateInput {
    return {
      id: brand.getId(),
      name: brand.getName(),
      slug: brand.getSlug(),
      description: brand.getDescription(),
      logoUrl: brand.getLogoUrl(),
      websiteUrl: brand.getWebsiteUrl(),
      status: brand.getStatus() as any,
      featured: brand.isFeatured(),
      metaTitle: brand.getMetaTitle(),
      metaDescription: brand.getMetaDescription(),
      createdAt: brand.getCreatedAt(),
      updatedAt: brand.getUpdatedAt(),
    };
  }
}