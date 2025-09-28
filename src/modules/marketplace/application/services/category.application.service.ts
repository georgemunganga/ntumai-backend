import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { Category } from '../../domain/entities/category.entity';
import { CategoryService } from '../../domain/services/category.service';

export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  iconUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  iconUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  metadata?: Record<string, any>;
}

export interface CategorySearchFilters {
  name?: string;
  parentId?: string;
  isActive?: boolean;
  level?: number;
  hasProducts?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'created' | 'updated' | 'sortOrder' | 'productCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CategorySearchResult {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CategoryTree {
  category: Category;
  children: CategoryTree[];
  productCount: number;
  level: number;
}

export interface CategoryWithStats {
  category: Category;
  productCount: number;
  activeProductCount: number;
  subcategoryCount: number;
  totalRevenue?: number;
  averageRating?: number;
}

export interface CategoryAnalytics {
  totalCategories: number;
  activeCategories: number;
  categoriesWithProducts: number;
  averageProductsPerCategory: number;
  topCategoriesByProducts: Array<{
    categoryId: string;
    name: string;
    productCount: number;
    revenue?: number;
  }>;
  topCategoriesByRevenue: Array<{
    categoryId: string;
    name: string;
    revenue: number;
    orderCount: number;
  }>;
  categoryDepthDistribution: Record<number, number>;
}

export interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  level: number;
  path: string[];
  children: CategoryHierarchy[];
  productCount: number;
  isActive: boolean;
}

@Injectable()
export class CategoryApplicationService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly productRepository: ProductRepository,
    private readonly categoryService: CategoryService,
  ) {}

  // Category Management
  async createCategory(data: CreateCategoryData): Promise<Category> {
    // Validate category name uniqueness within the same parent
    const existingCategory = await this.categoryRepository.findByNameAndParent(
      data.name,
      data.parentId,
    );
    
    if (existingCategory) {
      throw new ConflictException('Category with this name already exists in the same parent category');
    }

    // Validate parent category exists if parentId is provided
    if (data.parentId) {
      const parentCategory = await this.categoryRepository.findById(data.parentId);
      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
      
      // Check maximum nesting level
      const parentLevel = await this.categoryService.getCategoryLevel(parentCategory);
      if (parentLevel >= 5) { // Maximum 5 levels deep
        throw new BadRequestException('Maximum category nesting level exceeded');
      }
    }

    // Create category
    const category = Category.create(
      data.name,
      data.description,
      data.parentId,
      data.imageUrl,
      data.iconUrl,
      data.isActive !== false,
      data.sortOrder || 0,
      data.seoTitle,
      data.seoDescription,
      data.seoKeywords || [],
      data.metadata || {},
    );

    return await this.categoryRepository.create(category);
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Validate name uniqueness if name is being updated
    if (data.name && data.name !== category.getName()) {
      const existingCategory = await this.categoryRepository.findByNameAndParent(
        data.name,
        data.parentId || category.getParentId(),
      );
      
      if (existingCategory && existingCategory.getId() !== id) {
        throw new ConflictException('Category with this name already exists in the same parent category');
      }
    }

    // Validate parent category change
    if (data.parentId !== undefined && data.parentId !== category.getParentId()) {
      if (data.parentId) {
        const parentCategory = await this.categoryRepository.findById(data.parentId);
        if (!parentCategory) {
          throw new NotFoundException('Parent category not found');
        }

        // Prevent circular references
        const isCircular = await this.categoryService.wouldCreateCircularReference(
          category,
          parentCategory,
        );
        if (isCircular) {
          throw new BadRequestException('Cannot create circular reference in category hierarchy');
        }

        // Check nesting level
        const parentLevel = await this.categoryService.getCategoryLevel(parentCategory);
        const categoryDepth = await this.categoryService.getCategoryDepth(category);
        if (parentLevel + categoryDepth >= 5) {
          throw new BadRequestException('Maximum category nesting level would be exceeded');
        }
      }
    }

    // Update category
    if (data.name) category.updateName(data.name);
    if (data.description !== undefined) category.updateDescription(data.description);
    if (data.parentId !== undefined) category.updateParentId(data.parentId);
    if (data.imageUrl !== undefined) category.updateImageUrl(data.imageUrl);
    if (data.iconUrl !== undefined) category.updateIconUrl(data.iconUrl);
    if (data.isActive !== undefined) {
      if (data.isActive) {
        category.activate();
      } else {
        category.deactivate();
      }
    }
    if (data.sortOrder !== undefined) category.updateSortOrder(data.sortOrder);
    if (data.seoTitle !== undefined) category.updateSeoTitle(data.seoTitle);
    if (data.seoDescription !== undefined) category.updateSeoDescription(data.seoDescription);
    if (data.seoKeywords) category.updateSeoKeywords(data.seoKeywords);
    if (data.metadata) category.updateMetadata(data.metadata);

    return await this.categoryRepository.update(category);
  }

  async deleteCategory(id: string, forceDelete: boolean = false): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has subcategories
    const subcategories = await this.categoryRepository.findByParentId(id);
    if (subcategories.length > 0 && !forceDelete) {
      throw new BadRequestException('Cannot delete category with subcategories. Use forceDelete to override.');
    }

    // Check if category has products
    const productCount = await this.productRepository.countByCategory(id);
    if (productCount > 0 && !forceDelete) {
      throw new BadRequestException('Cannot delete category with products. Use forceDelete to override.');
    }

    if (forceDelete) {
      // Move subcategories to parent or root level
      for (const subcategory of subcategories) {
        subcategory.updateParentId(category.getParentId());
        await this.categoryRepository.update(subcategory);
      }

      // Move products to parent category or uncategorized
      if (productCount > 0) {
        await this.productRepository.updateCategoryForProducts(
          id,
          category.getParentId() || null,
        );
      }
    }

    await this.categoryRepository.delete(id);
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  // Category Search and Filtering
  async searchCategories(filters: CategorySearchFilters): Promise<CategorySearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { categories, total } = await this.categoryRepository.findWithFilters({
      ...filters,
      offset,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      categories,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getAllCategories(includeInactive: boolean = false): Promise<Category[]> {
    return await this.categoryRepository.findAll(includeInactive);
  }

  async getRootCategories(includeInactive: boolean = false): Promise<Category[]> {
    return await this.categoryRepository.findRootCategories(includeInactive);
  }

  async getSubcategories(parentId: string, includeInactive: boolean = false): Promise<Category[]> {
    return await this.categoryRepository.findByParentId(parentId, includeInactive);
  }

  // Category Hierarchy
  async getCategoryTree(rootId?: string, maxDepth: number = 5): Promise<CategoryTree[]> {
    const rootCategories = rootId 
      ? [await this.getCategoryById(rootId)]
      : await this.getRootCategories();

    const trees: CategoryTree[] = [];

    for (const rootCategory of rootCategories) {
      const tree = await this.buildCategoryTree(rootCategory, 0, maxDepth);
      trees.push(tree);
    }

    return trees;
  }

  private async buildCategoryTree(
    category: Category,
    currentLevel: number,
    maxDepth: number,
  ): Promise<CategoryTree> {
    const productCount = await this.productRepository.countByCategory(category.getId());
    const children: CategoryTree[] = [];

    if (currentLevel < maxDepth) {
      const subcategories = await this.getSubcategories(category.getId());
      
      for (const subcategory of subcategories) {
        const childTree = await this.buildCategoryTree(subcategory, currentLevel + 1, maxDepth);
        children.push(childTree);
      }
    }

    return {
      category,
      children,
      productCount,
      level: currentLevel,
    };
  }

  async getCategoryHierarchy(): Promise<CategoryHierarchy[]> {
    const rootCategories = await this.getRootCategories();
    const hierarchies: CategoryHierarchy[] = [];

    for (const rootCategory of rootCategories) {
      const hierarchy = await this.buildCategoryHierarchy(rootCategory, 0, []);
      hierarchies.push(hierarchy);
    }

    return hierarchies;
  }

  private async buildCategoryHierarchy(
    category: Category,
    level: number,
    path: string[],
  ): Promise<CategoryHierarchy> {
    const productCount = await this.productRepository.countByCategory(category.getId());
    const subcategories = await this.getSubcategories(category.getId());
    const children: CategoryHierarchy[] = [];
    const currentPath = [...path, category.getName()];

    for (const subcategory of subcategories) {
      const childHierarchy = await this.buildCategoryHierarchy(
        subcategory,
        level + 1,
        currentPath,
      );
      children.push(childHierarchy);
    }

    return {
      id: category.getId(),
      name: category.getName(),
      slug: category.getSlug(),
      level,
      path: currentPath,
      children,
      productCount,
      isActive: category.isActive(),
    };
  }

  async getCategoryPath(categoryId: string): Promise<Category[]> {
    const category = await this.getCategoryById(categoryId);
    return await this.categoryService.getCategoryPath(category);
  }

  async getCategoryBreadcrumbs(categoryId: string): Promise<Array<{
    id: string;
    name: string;
    slug: string;
  }>> {
    const path = await this.getCategoryPath(categoryId);
    return path.map(category => ({
      id: category.getId(),
      name: category.getName(),
      slug: category.getSlug(),
    }));
  }

  // Category Statistics
  async getCategoryWithStats(id: string): Promise<CategoryWithStats> {
    const category = await this.getCategoryById(id);
    const productCount = await this.productRepository.countByCategory(id);
    const activeProductCount = await this.productRepository.countByCategoryAndStatus(id, 'active');
    const subcategoryCount = await this.categoryRepository.countByParentId(id);
    
    // Optional: Get revenue and rating stats
    const stats = await this.categoryRepository.getCategoryStats(id);

    return {
      category,
      productCount,
      activeProductCount,
      subcategoryCount,
      totalRevenue: stats?.totalRevenue,
      averageRating: stats?.averageRating,
    };
  }

  async getCategoryAnalytics(filters: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<CategoryAnalytics> {
    return await this.categoryRepository.getAnalytics(filters);
  }

  // Category Status Management
  async activateCategory(id: string, includeSubcategories: boolean = false): Promise<Category> {
    const category = await this.getCategoryById(id);
    category.activate();
    
    const updatedCategory = await this.categoryRepository.update(category);

    if (includeSubcategories) {
      const subcategories = await this.categoryRepository.findByParentId(id, true);
      for (const subcategory of subcategories) {
        subcategory.activate();
        await this.categoryRepository.update(subcategory);
      }
    }

    return updatedCategory;
  }

  async deactivateCategory(id: string, includeSubcategories: boolean = false): Promise<Category> {
    const category = await this.getCategoryById(id);
    category.deactivate();
    
    const updatedCategory = await this.categoryRepository.update(category);

    if (includeSubcategories) {
      const subcategories = await this.categoryRepository.findByParentId(id, true);
      for (const subcategory of subcategories) {
        subcategory.deactivate();
        await this.categoryRepository.update(subcategory);
      }
    }

    return updatedCategory;
  }

  // Category Sorting
  async updateCategorySortOrder(updates: Array<{ id: string; sortOrder: number }>): Promise<Category[]> {
    const updatedCategories: Category[] = [];

    for (const update of updates) {
      const category = await this.getCategoryById(update.id);
      category.updateSortOrder(update.sortOrder);
      const updatedCategory = await this.categoryRepository.update(category);
      updatedCategories.push(updatedCategory);
    }

    return updatedCategories;
  }

  async reorderCategories(parentId: string | null, categoryIds: string[]): Promise<Category[]> {
    const updates = categoryIds.map((id, index) => ({
      id,
      sortOrder: index + 1,
    }));

    return await this.updateCategorySortOrder(updates);
  }

  // Bulk Operations
  async bulkUpdateCategories(updates: Array<{
    id: string;
    data: UpdateCategoryData;
  }>): Promise<Category[]> {
    const updatedCategories: Category[] = [];

    for (const update of updates) {
      try {
        const updatedCategory = await this.updateCategory(update.id, update.data);
        updatedCategories.push(updatedCategory);
      } catch (error) {
        console.error(`Failed to update category ${update.id}:`, error);
      }
    }

    return updatedCategories;
  }

  async bulkActivateCategories(categoryIds: string[]): Promise<Category[]> {
    const categories = await this.categoryRepository.findByIds(categoryIds);
    const activatedCategories: Category[] = [];

    for (const category of categories) {
      try {
        category.activate();
        const updatedCategory = await this.categoryRepository.update(category);
        activatedCategories.push(updatedCategory);
      } catch (error) {
        console.error(`Failed to activate category ${category.getId()}:`, error);
      }
    }

    return activatedCategories;
  }

  async bulkDeactivateCategories(categoryIds: string[]): Promise<Category[]> {
    const categories = await this.categoryRepository.findByIds(categoryIds);
    const deactivatedCategories: Category[] = [];

    for (const category of categories) {
      try {
        category.deactivate();
        const updatedCategory = await this.categoryRepository.update(category);
        deactivatedCategories.push(updatedCategory);
      } catch (error) {
        console.error(`Failed to deactivate category ${category.getId()}:`, error);
      }
    }

    return deactivatedCategories;
  }

  // Category Migration
  async moveCategory(categoryId: string, newParentId: string | null): Promise<Category> {
    const category = await this.getCategoryById(categoryId);
    
    if (newParentId) {
      const newParent = await this.getCategoryById(newParentId);
      
      // Prevent circular references
      const isCircular = await this.categoryService.wouldCreateCircularReference(category, newParent);
      if (isCircular) {
        throw new BadRequestException('Cannot create circular reference in category hierarchy');
      }

      // Check nesting level
      const parentLevel = await this.categoryService.getCategoryLevel(newParent);
      const categoryDepth = await this.categoryService.getCategoryDepth(category);
      if (parentLevel + categoryDepth >= 5) {
        throw new BadRequestException('Maximum category nesting level would be exceeded');
      }
    }

    category.updateParentId(newParentId);
    return await this.categoryRepository.update(category);
  }

  async mergeCategoriesIntoTarget(sourceIds: string[], targetId: string): Promise<{
    targetCategory: Category;
    movedProductCount: number;
    deletedCategories: string[];
  }> {
    const targetCategory = await this.getCategoryById(targetId);
    const sourceCategories = await this.categoryRepository.findByIds(sourceIds);
    
    let movedProductCount = 0;
    const deletedCategories: string[] = [];

    for (const sourceCategory of sourceCategories) {
      // Move products from source to target category
      const productCount = await this.productRepository.countByCategory(sourceCategory.getId());
      if (productCount > 0) {
        await this.productRepository.updateCategoryForProducts(
          sourceCategory.getId(),
          targetId,
        );
        movedProductCount += productCount;
      }

      // Move subcategories to target category
      const subcategories = await this.getSubcategories(sourceCategory.getId());
      for (const subcategory of subcategories) {
        subcategory.updateParentId(targetId);
        await this.categoryRepository.update(subcategory);
      }

      // Delete source category
      await this.categoryRepository.delete(sourceCategory.getId());
      deletedCategories.push(sourceCategory.getId());
    }

    return {
      targetCategory,
      movedProductCount,
      deletedCategories,
    };
  }

  // Category Search and Suggestions
  async searchCategoriesByName(query: string, limit: number = 10): Promise<Category[]> {
    return await this.categoryRepository.searchByName(query, limit);
  }

  async getCategorySuggestions(query: string, limit: number = 5): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    path: string;
    productCount: number;
  }>> {
    const categories = await this.searchCategoriesByName(query, limit);
    const suggestions = [];

    for (const category of categories) {
      const path = await this.getCategoryPath(category.getId());
      const productCount = await this.productRepository.countByCategory(category.getId());
      
      suggestions.push({
        id: category.getId(),
        name: category.getName(),
        slug: category.getSlug(),
        path: path.map(c => c.getName()).join(' > '),
        productCount,
      });
    }

    return suggestions;
  }
}