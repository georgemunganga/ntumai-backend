import { Injectable, Logger } from '@nestjs/common';
import {
  CommunicationTemplate,
  TemplateType,
  TemplateCategory,
  TemplateVariable,
} from '../../domain/entities/communication-template.entity';
import { MessageAttachment } from '../../domain/value-objects/message-content.vo';
import {
  TemplateRepository,
  TemplateFilters,
  PaginatedResult,
  PaginationOptions,
} from '../../domain/repositories/communication.repository';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTemplateRequest {
  name: string;
  type: TemplateType;
  category: TemplateCategory;
  subject: string;
  bodyTemplate: string;
  variables?: TemplateVariable[];
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  metadata?: {
    description?: string;
    tags?: string[];
    approvalRequired?: boolean;
  };
}

export interface UpdateTemplateRequest {
  subject?: string;
  bodyTemplate?: string;
  variables?: TemplateVariable[];
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  metadata?: {
    description?: string;
    tags?: string[];
  };
}

export interface TemplatePreviewRequest {
  templateId: string;
  variables: Record<string, any>;
}

export interface TemplatePreviewResponse {
  subject: string;
  body: string;
  variables: TemplateVariable[];
  missingVariables: string[];
  validationErrors: string[];
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingVariables: string[];
  unusedVariables: string[];
}

export interface TemplateUsageStats {
  templateId: string;
  name: string;
  totalSent: number;
  successRate: number;
  lastUsed?: Date;
  popularVariables: Record<string, number>;
}

@Injectable()
export class TemplateManagementService {
  private readonly logger = new Logger(TemplateManagementService.name);

  constructor(private readonly templateRepository: TemplateRepository) {}

  async createTemplate(request: CreateTemplateRequest): Promise<CommunicationTemplate> {
    this.logger.debug(`Creating template: ${request.name}`);

    try {
      // Check if template with same name and type already exists
      const existingTemplate = await this.templateRepository.findByName(
        request.name,
        request.type,
      );
      
      if (existingTemplate) {
        throw new Error(
          `Template with name '${request.name}' and type '${request.type}' already exists`,
        );
      }

      // Convert attachments to MessageAttachment objects
      const attachments = request.attachments?.map(
        att => new MessageAttachment(
          att.filename,
          att.content,
          att.contentType,
          att.content.length,
        ),
      ) || [];

      // Create template entity
      const templateId = uuidv4();
      const template = CommunicationTemplate.create(
        templateId,
        request.name,
        request.type,
        request.category,
        request.subject,
        request.bodyTemplate,
        request.variables || [],
        attachments,
        {
          description: request.metadata?.description,
          tags: request.metadata?.tags,
          approvalRequired: request.metadata?.approvalRequired,
          version: '1.0.0',
          isActive: false, // Start inactive until approved if needed
        },
      );

      // Auto-activate if no approval required
      if (!template.requiresApproval) {
        template.activate();
      }

      // Save to repository
      const savedTemplate = await this.templateRepository.save(template);
      
      this.logger.debug(`Template created successfully: ${savedTemplate.id}`);
      return savedTemplate;
    } catch (error) {
      this.logger.error(`Failed to create template: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateTemplate(
    templateId: string,
    request: UpdateTemplateRequest,
  ): Promise<CommunicationTemplate> {
    this.logger.debug(`Updating template: ${templateId}`);

    try {
      const template = await this.templateRepository.findById(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Convert attachments if provided
      let attachments: MessageAttachment[] | undefined;
      if (request.attachments) {
        attachments = request.attachments.map(
          att => new MessageAttachment(
            att.filename,
            att.content,
            att.contentType,
            att.content.length,
          ),
        );
      }

      // Update template content
      template.updateContent(
        request.subject || template.subject,
        request.bodyTemplate || template.bodyTemplate,
        request.variables,
        attachments,
      );

      // Save updated template
      const updatedTemplate = await this.templateRepository.save(template);
      
      this.logger.debug(`Template updated successfully: ${templateId}`);
      return updatedTemplate;
    } catch (error) {
      this.logger.error(`Failed to update template: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTemplate(templateId: string): Promise<CommunicationTemplate | null> {
    return await this.templateRepository.findById(templateId);
  }

  async getTemplateByName(
    name: string,
    type?: TemplateType,
  ): Promise<CommunicationTemplate | null> {
    return await this.templateRepository.findByName(name, type);
  }

  async listTemplates(
    filters?: TemplateFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommunicationTemplate>> {
    return await this.templateRepository.findMany(
      filters,
      { field: 'createdAt', direction: 'desc' },
      pagination,
    );
  }

  async getActiveTemplates(
    type?: TemplateType,
    category?: TemplateCategory,
  ): Promise<CommunicationTemplate[]> {
    return await this.templateRepository.findActiveTemplates(type, category);
  }

  async activateTemplate(templateId: string): Promise<void> {
    this.logger.debug(`Activating template: ${templateId}`);

    try {
      const template = await this.templateRepository.findById(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      template.activate();
      await this.templateRepository.save(template);
      
      this.logger.debug(`Template activated: ${templateId}`);
    } catch (error) {
      this.logger.error(`Failed to activate template: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deactivateTemplate(templateId: string): Promise<void> {
    this.logger.debug(`Deactivating template: ${templateId}`);

    try {
      const template = await this.templateRepository.findById(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      template.deactivate();
      await this.templateRepository.save(template);
      
      this.logger.debug(`Template deactivated: ${templateId}`);
    } catch (error) {
      this.logger.error(`Failed to deactivate template: ${error.message}`, error.stack);
      throw error;
    }
  }

  async approveTemplate(templateId: string, approvedBy: string): Promise<void> {
    this.logger.debug(`Approving template: ${templateId}`);

    try {
      const template = await this.templateRepository.findById(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      template.approve(approvedBy);
      await this.templateRepository.save(template);
      
      this.logger.debug(`Template approved: ${templateId}`);
    } catch (error) {
      this.logger.error(`Failed to approve template: ${error.message}`, error.stack);
      throw error;
    }
  }

  async previewTemplate(
    request: TemplatePreviewRequest,
  ): Promise<TemplatePreviewResponse> {
    this.logger.debug(`Previewing template: ${request.templateId}`);

    try {
      const template = await this.templateRepository.findById(request.templateId);
      if (!template) {
        throw new Error(`Template not found: ${request.templateId}`);
      }

      const validationResult = this.validateTemplateVariables(
        template,
        request.variables,
      );

      let renderedContent;
      try {
        renderedContent = template.render(request.variables);
      } catch (error) {
        return {
          subject: template.subject,
          body: template.bodyTemplate,
          variables: template.variables,
          missingVariables: validationResult.missingVariables,
          validationErrors: [error.message],
        };
      }

      return {
        subject: renderedContent.subject || '',
        body: renderedContent.body,
        variables: template.variables,
        missingVariables: validationResult.missingVariables,
        validationErrors: validationResult.errors,
      };
    } catch (error) {
      this.logger.error(`Failed to preview template: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateTemplate(
    templateId: string,
    variables?: Record<string, any>,
  ): Promise<TemplateValidationResult> {
    try {
      const template = await this.templateRepository.findById(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      let missingVariables: string[] = [];
      let unusedVariables: string[] = [];

      // Basic template validation
      try {
        // This will throw if template structure is invalid
        template.render({});
      } catch (error) {
        if (!error.message.includes('Required variable missing')) {
          errors.push(error.message);
        }
      }

      // Variable validation if provided
      if (variables) {
        const variableValidation = this.validateTemplateVariables(template, variables);
        errors.push(...variableValidation.errors);
        missingVariables = variableValidation.missingVariables;
        unusedVariables = variableValidation.unusedVariables;
      }

      // Check for unused template variables
      const templateContent = template.subject + ' ' + template.bodyTemplate;
      const definedVariables = template.variables.map(v => v.name);
      const usedVariables = this.extractVariablesFromTemplate(templateContent);
      
      const unusedDefinedVariables = definedVariables.filter(
        name => !usedVariables.includes(name),
      );
      
      if (unusedDefinedVariables.length > 0) {
        warnings.push(
          `Unused variable definitions: ${unusedDefinedVariables.join(', ')}`,
        );
      }

      // Check for undefined variables in template
      const undefinedVariables = usedVariables.filter(
        name => !definedVariables.includes(name),
      );
      
      if (undefinedVariables.length > 0) {
        errors.push(
          `Undefined variables in template: ${undefinedVariables.join(', ')}`,
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        missingVariables,
        unusedVariables,
      };
    } catch (error) {
      this.logger.error(`Failed to validate template: ${error.message}`, error.stack);
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
        missingVariables: [],
        unusedVariables: [],
      };
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    this.logger.debug(`Deleting template: ${templateId}`);

    try {
      const template = await this.templateRepository.findById(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Check if template is being used (in a real implementation,
      // you might want to check message history)
      if (template.isActive) {
        throw new Error('Cannot delete active template. Deactivate it first.');
      }

      await this.templateRepository.delete(templateId);
      
      this.logger.debug(`Template deleted: ${templateId}`);
    } catch (error) {
      this.logger.error(`Failed to delete template: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPendingApprovals(): Promise<CommunicationTemplate[]> {
    return await this.templateRepository.findPendingApproval();
  }

  async duplicateTemplate(
    templateId: string,
    newName: string,
  ): Promise<CommunicationTemplate> {
    this.logger.debug(`Duplicating template: ${templateId}`);

    try {
      const originalTemplate = await this.templateRepository.findById(templateId);
      if (!originalTemplate) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Create new template with same content but different name
      const duplicateRequest: CreateTemplateRequest = {
        name: newName,
        type: originalTemplate.type,
        category: originalTemplate.category,
        subject: originalTemplate.subject,
        bodyTemplate: originalTemplate.bodyTemplate,
        variables: originalTemplate.variables,
        attachments: originalTemplate.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
        metadata: {
          description: `Duplicate of ${originalTemplate.name}`,
          tags: originalTemplate.metadata.tags,
          approvalRequired: originalTemplate.metadata.approvalRequired,
        },
      };

      return await this.createTemplate(duplicateRequest);
    } catch (error) {
      this.logger.error(`Failed to duplicate template: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods
  private validateTemplateVariables(
    template: CommunicationTemplate,
    variables: Record<string, any>,
  ): {
    errors: string[];
    missingVariables: string[];
    unusedVariables: string[];
  } {
    const errors: string[] = [];
    const missingVariables: string[] = [];
    const unusedVariables: string[] = [];

    // Check required variables
    for (const templateVar of template.variables) {
      if (templateVar.required && !(templateVar.name in variables)) {
        missingVariables.push(templateVar.name);
      }
    }

    // Check for unused provided variables
    const templateVariableNames = template.variables.map(v => v.name);
    for (const providedVar of Object.keys(variables)) {
      if (!templateVariableNames.includes(providedVar)) {
        unusedVariables.push(providedVar);
      }
    }

    // Validate variable values
    for (const [name, value] of Object.entries(variables)) {
      const templateVar = template.variables.find(v => v.name === name);
      if (templateVar) {
        try {
          // This would call the template's variable validation
          // For now, we'll do basic validation
          if (templateVar.required && (value === null || value === undefined)) {
            errors.push(`Required variable ${name} cannot be null or undefined`);
          }
        } catch (error) {
          errors.push(`Invalid value for variable ${name}: ${error.message}`);
        }
      }
    }

    return { errors, missingVariables, unusedVariables };
  }

  private extractVariablesFromTemplate(template: string): string[] {
    const variableRegex = /{{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }
}