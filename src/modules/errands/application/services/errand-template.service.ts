import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ErrandTemplateEntity } from '../../domain/entities/errand-template.entity';
import { ErrandTemplateRepository } from '../../domain/repositories/errand-template.repository';
import { LocationVO } from '../../domain/value-objects/location.vo';
import { PriorityVO } from '../../domain/value-objects/priority.vo';

export interface CreateErrandTemplateRequest {
  name: string;
  description?: string;
  category: string;
  defaultPickupLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  defaultDropoffLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  estimatedPrice?: number;
  estimatedDuration?: number;
  defaultPriority?: string;
  defaultRequirements?: string[];
  instructions?: string;
  tags?: string[];
  createdBy: string;
}

export interface UpdateErrandTemplateRequest {
  name?: string;
  description?: string;
  category?: string;
  defaultPickupLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  defaultDropoffLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  estimatedPrice?: number;
  estimatedDuration?: number;
  defaultPriority?: string;
  defaultRequirements?: string[];
  instructions?: string;
  tags?: string[];
}

export interface ErrandTemplateFiltersRequest {
  category?: string[];
  tags?: string[];
  createdBy?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
}

export interface ErrandTemplateSortRequest {
  field: 'name' | 'category' | 'usageCount' | 'createdAt' | 'estimatedPrice';
  direction: 'asc' | 'desc';
}

export interface PaginationRequest {
  page: number;
  limit: number;
}

@Injectable()
export class ErrandTemplateService {
  constructor(
    private readonly errandTemplateRepository: ErrandTemplateRepository,
  ) {}

  async createTemplate(request: CreateErrandTemplateRequest): Promise<ErrandTemplateEntity> {
    // Check if template name is unique for the user
    const existingTemplate = await this.errandTemplateRepository.checkNameUniqueness(
      request.name,
      request.createdBy,
    );

    if (existingTemplate) {
      throw new BadRequestException('Template name already exists');
    }

    // Create location VOs if provided
    const defaultPickupLocation = request.defaultPickupLocation
      ? new LocationVO(
          request.defaultPickupLocation.address,
          request.defaultPickupLocation.latitude,
          request.defaultPickupLocation.longitude,
          request.defaultPickupLocation.instructions,
        )
      : undefined;

    const defaultDropoffLocation = request.defaultDropoffLocation
      ? new LocationVO(
          request.defaultDropoffLocation.address,
          request.defaultDropoffLocation.latitude,
          request.defaultDropoffLocation.longitude,
          request.defaultDropoffLocation.instructions,
        )
      : undefined;

    // Create priority VO if provided
    const defaultPriority = request.defaultPriority
      ? new PriorityVO(request.defaultPriority)
      : new PriorityVO('medium');

    // Create template entity
    const template = ErrandTemplateEntity.create({
      name: request.name,
      description: request.description,
      category: request.category,
      defaultPickupLocation,
      defaultDropoffLocation,
      estimatedPrice: request.estimatedPrice,
      estimatedDuration: request.estimatedDuration,
      defaultPriority,
      defaultRequirements: request.defaultRequirements || [],
      instructions: request.instructions,
      tags: request.tags || [],
      createdBy: request.createdBy,
    });

    return this.errandTemplateRepository.save(template);
  }

  async getTemplateById(id: string, userId: string): Promise<ErrandTemplateEntity> {
    const template = await this.errandTemplateRepository.findById(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check user access
    if (!template.hasUserAccess(userId)) {
      throw new ForbiddenException('Access denied to this template');
    }

    return template;
  }

  async getTemplates(
    filters: ErrandTemplateFiltersRequest,
    sort: ErrandTemplateSortRequest,
    pagination: PaginationRequest,
    userId: string,
  ): Promise<{ templates: ErrandTemplateEntity[]; total: number; page: number; limit: number }> {
    const result = await this.errandTemplateRepository.findMany({
      filters: {
        category: filters.category,
        tags: filters.tags,
        createdBy: filters.createdBy,
        isActive: filters.isActive,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minDuration: filters.minDuration,
        maxDuration: filters.maxDuration,
        userId, // For access control
      },
      sort: {
        field: sort.field,
        direction: sort.direction,
      },
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
      },
    });

    return {
      templates: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async updateTemplate(
    id: string,
    request: UpdateErrandTemplateRequest,
    userId: string,
  ): Promise<ErrandTemplateEntity> {
    const template = await this.getTemplateById(id, userId);

    // Check if user can update (only creator can update)
    if (template.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only the template creator can update the template');
    }

    // Check name uniqueness if name is being updated
    if (request.name && request.name !== template.getName()) {
      const existingTemplate = await this.errandTemplateRepository.checkNameUniqueness(
        request.name,
        userId,
      );

      if (existingTemplate) {
        throw new BadRequestException('Template name already exists');
      }
    }

    // Create location VOs if provided
    const defaultPickupLocation = request.defaultPickupLocation
      ? new LocationVO(
          request.defaultPickupLocation.address,
          request.defaultPickupLocation.latitude,
          request.defaultPickupLocation.longitude,
          request.defaultPickupLocation.instructions,
        )
      : undefined;

    const defaultDropoffLocation = request.defaultDropoffLocation
      ? new LocationVO(
          request.defaultDropoffLocation.address,
          request.defaultDropoffLocation.latitude,
          request.defaultDropoffLocation.longitude,
          request.defaultDropoffLocation.instructions,
        )
      : undefined;

    // Create priority VO if provided
    const defaultPriority = request.defaultPriority
      ? new PriorityVO(request.defaultPriority)
      : undefined;

    // Update template
    const updatedTemplate = template.update({
      name: request.name,
      description: request.description,
      category: request.category,
      defaultPickupLocation,
      defaultDropoffLocation,
      estimatedPrice: request.estimatedPrice,
      estimatedDuration: request.estimatedDuration,
      defaultPriority,
      defaultRequirements: request.defaultRequirements,
      instructions: request.instructions,
      tags: request.tags,
    });

    return this.errandTemplateRepository.save(updatedTemplate);
  }

  async deleteTemplate(id: string, userId: string): Promise<void> {
    const template = await this.getTemplateById(id, userId);

    // Check if user can delete (only creator can delete)
    if (template.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only the template creator can delete the template');
    }

    await this.errandTemplateRepository.delete(id);
  }

  async activateTemplate(id: string, userId: string): Promise<ErrandTemplateEntity> {
    const template = await this.getTemplateById(id, userId);

    // Check if user can activate (only creator can activate)
    if (template.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only the template creator can activate the template');
    }

    const activatedTemplate = template.activate();
    return this.errandTemplateRepository.save(activatedTemplate);
  }

  async deactivateTemplate(id: string, userId: string): Promise<ErrandTemplateEntity> {
    const template = await this.getTemplateById(id, userId);

    // Check if user can deactivate (only creator can deactivate)
    if (template.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only the template creator can deactivate the template');
    }

    const deactivatedTemplate = template.deactivate();
    return this.errandTemplateRepository.save(deactivatedTemplate);
  }

  async useTemplate(id: string, userId: string): Promise<ErrandTemplateEntity> {
    const template = await this.errandTemplateRepository.findById(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check if template can be used by user
    if (!template.canBeUsedBy(userId)) {
      throw new ForbiddenException('Template cannot be used by this user');
    }

    // Increment usage count
    const updatedTemplate = template.incrementUsage();
    return this.errandTemplateRepository.save(updatedTemplate);
  }

  async addTagToTemplate(
    id: string,
    tag: string,
    userId: string,
  ): Promise<ErrandTemplateEntity> {
    const template = await this.getTemplateById(id, userId);

    // Check if user can modify (only creator can modify)
    if (template.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only the template creator can modify tags');
    }

    const updatedTemplate = template.addTag(tag);
    return this.errandTemplateRepository.save(updatedTemplate);
  }

  async removeTagFromTemplate(
    id: string,
    tag: string,
    userId: string,
  ): Promise<ErrandTemplateEntity> {
    const template = await this.getTemplateById(id, userId);

    // Check if user can modify (only creator can modify)
    if (template.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only the template creator can modify tags');
    }

    const updatedTemplate = template.removeTag(tag);
    return this.errandTemplateRepository.save(updatedTemplate);
  }

  async addRequirementToTemplate(
    id: string,
    requirement: string,
    userId: string,
  ): Promise<ErrandTemplateEntity> {
    const template = await this.getTemplateById(id, userId);

    // Check if user can modify (only creator can modify)
    if (template.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only the template creator can modify requirements');
    }

    const updatedTemplate = template.addRequirement(requirement);
    return this.errandTemplateRepository.save(updatedTemplate);
  }

  async removeRequirementFromTemplate(
    id: string,
    requirement: string,
    userId: string,
  ): Promise<ErrandTemplateEntity> {
    const template = await this.getTemplateById(id, userId);

    // Check if user can modify (only creator can modify)
    if (template.getCreatedBy() !== userId) {
      throw new ForbiddenException('Only the template creator can modify requirements');
    }

    const updatedTemplate = template.removeRequirement(requirement);
    return this.errandTemplateRepository.save(updatedTemplate);
  }

  async getActiveTemplates(
    pagination?: PaginationRequest,
  ): Promise<{ templates: ErrandTemplateEntity[]; total: number }> {
    const result = await this.errandTemplateRepository.findActive(pagination);
    return {
      templates: result.items,
      total: result.total,
    };
  }

  async getTemplatesByCategory(
    category: string,
    pagination?: PaginationRequest,
  ): Promise<{ templates: ErrandTemplateEntity[]; total: number }> {
    const result = await this.errandTemplateRepository.findByCategory(category, pagination);
    return {
      templates: result.items,
      total: result.total,
    };
  }

  async getTemplatesByTags(
    tags: string[],
    pagination?: PaginationRequest,
  ): Promise<{ templates: ErrandTemplateEntity[]; total: number }> {
    const result = await this.errandTemplateRepository.findByTags(tags, pagination);
    return {
      templates: result.items,
      total: result.total,
    };
  }

  async getPublicTemplates(
    pagination?: PaginationRequest,
  ): Promise<{ templates: ErrandTemplateEntity[]; total: number }> {
    const result = await this.errandTemplateRepository.findPublic(pagination);
    return {
      templates: result.items,
      total: result.total,
    };
  }

  async getMostUsedTemplates(
    limit: number = 10,
  ): Promise<ErrandTemplateEntity[]> {
    const result = await this.errandTemplateRepository.findMostUsed({ page: 1, limit });
    return result.items;
  }

  async getRecentTemplates(
    limit: number = 10,
  ): Promise<ErrandTemplateEntity[]> {
    const result = await this.errandTemplateRepository.findRecent({ page: 1, limit });
    return result.items;
  }

  async searchTemplates(
    query: string,
    pagination?: PaginationRequest,
  ): Promise<{ templates: ErrandTemplateEntity[]; total: number }> {
    const result = await this.errandTemplateRepository.search(query, pagination);
    return {
      templates: result.items,
      total: result.total,
    };
  }

  async getTemplateStatistics(userId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    totalUsage: number;
    averageUsage: number;
  }> {
    return this.errandTemplateRepository.getStatistics(userId);
  }

  async getTemplateCategories(): Promise<string[]> {
    return this.errandTemplateRepository.getCategories();
  }

  async getTemplateTags(): Promise<string[]> {
    return this.errandTemplateRepository.getTags();
  }

  async getPopularCategories(limit: number = 10): Promise<Array<{ category: string; count: number }>> {
    return this.errandTemplateRepository.getPopularCategories(limit);
  }

  async getPopularTags(limit: number = 10): Promise<Array<{ tag: string; count: number }>> {
    return this.errandTemplateRepository.getPopularTags(limit);
  }

  async getSimilarTemplates(
    templateId: string,
    limit: number = 5,
  ): Promise<ErrandTemplateEntity[]> {
    const result = await this.errandTemplateRepository.findSimilar(templateId, { page: 1, limit });
    return result.items;
  }
}