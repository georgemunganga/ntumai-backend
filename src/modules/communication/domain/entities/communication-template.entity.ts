import { MessageContent, MessageAttachment } from '../value-objects/message-content.vo';

export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PUSH = 'push',
}

export enum TemplateCategory {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
  OTP = 'otp',
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'url' | 'email';
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface TemplateMetadata {
  version: string;
  author?: string;
  description?: string;
  tags?: string[];
  lastModified: Date;
  isActive: boolean;
  approvalRequired?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export class CommunicationTemplate {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: TemplateType,
    public readonly category: TemplateCategory,
    private _subject: string,
    private _bodyTemplate: string,
    private _variables: TemplateVariable[],
    private _attachments: MessageAttachment[],
    private _metadata: TemplateMetadata,
    private _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(
    id: string,
    name: string,
    type: TemplateType,
    category: TemplateCategory,
    subject: string,
    bodyTemplate: string,
    variables: TemplateVariable[] = [],
    attachments: MessageAttachment[] = [],
    metadata: Partial<TemplateMetadata> = {},
  ): CommunicationTemplate {
    const now = new Date();
    const fullMetadata: TemplateMetadata = {
      version: '1.0.0',
      lastModified: now,
      isActive: true,
      ...metadata,
    };

    const template = new CommunicationTemplate(
      id,
      name,
      type,
      category,
      subject,
      bodyTemplate,
      variables,
      attachments,
      fullMetadata,
      now,
      now,
    );

    template.validateTemplate();
    return template;
  }

  static fromPersistence(
    id: string,
    name: string,
    type: TemplateType,
    category: TemplateCategory,
    subject: string,
    bodyTemplate: string,
    variables: TemplateVariable[],
    attachments: MessageAttachment[],
    metadata: TemplateMetadata,
    createdAt: Date,
    updatedAt: Date,
  ): CommunicationTemplate {
    return new CommunicationTemplate(
      id,
      name,
      type,
      category,
      subject,
      bodyTemplate,
      variables,
      attachments,
      metadata,
      createdAt,
      updatedAt,
    );
  }

  // Getters
  get subject(): string {
    return this._subject;
  }

  get bodyTemplate(): string {
    return this._bodyTemplate;
  }

  get variables(): TemplateVariable[] {
    return [...this._variables];
  }

  get attachments(): MessageAttachment[] {
    return [...this._attachments];
  }

  get metadata(): TemplateMetadata {
    return { ...this._metadata };
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isActive(): boolean {
    return this._metadata.isActive;
  }

  get requiresApproval(): boolean {
    return this._metadata.approvalRequired || false;
  }

  get isApproved(): boolean {
    if (!this.requiresApproval) {
      return true;
    }
    return !!(this._metadata.approvedBy && this._metadata.approvedAt);
  }

  // Business methods
  updateContent(
    subject: string,
    bodyTemplate: string,
    variables?: TemplateVariable[],
    attachments?: MessageAttachment[],
  ): void {
    this._subject = subject;
    this._bodyTemplate = bodyTemplate;
    
    if (variables) {
      this._variables = variables;
    }
    
    if (attachments) {
      this._attachments = attachments;
    }

    this._updatedAt = new Date();
    this._metadata.lastModified = this._updatedAt;
    
    // Increment version
    const currentVersion = this._metadata.version.split('.');
    const patchVersion = parseInt(currentVersion[2] || '0') + 1;
    this._metadata.version = `${currentVersion[0]}.${currentVersion[1]}.${patchVersion}`;
    
    // Reset approval if required
    if (this.requiresApproval) {
      this._metadata.approvedBy = undefined;
      this._metadata.approvedAt = undefined;
    }

    this.validateTemplate();
  }

  activate(): void {
    if (!this.isApproved) {
      throw new Error('Template must be approved before activation');
    }
    
    this._metadata.isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._metadata.isActive = false;
    this._updatedAt = new Date();
  }

  approve(approvedBy: string): void {
    if (!this.requiresApproval) {
      throw new Error('Template does not require approval');
    }
    
    this._metadata.approvedBy = approvedBy;
    this._metadata.approvedAt = new Date();
    this._updatedAt = new Date();
  }

  render(variables: Record<string, any>): MessageContent {
    if (!this.isActive) {
      throw new Error('Cannot render inactive template');
    }
    
    if (!this.isApproved) {
      throw new Error('Cannot render unapproved template');
    }

    this.validateVariables(variables);
    
    const renderedSubject = this.renderTemplate(this._subject, variables);
    const renderedBody = this.renderTemplate(this._bodyTemplate, variables);
    
    return MessageContent.create(
      renderedBody,
      renderedSubject,
      this._attachments,
    );
  }

  // Template validation
  private validateTemplate(): void {
    this.validateSubject();
    this.validateBodyTemplate();
    this.validateVariables();
    this.validateAttachments();
  }

  private validateSubject(): void {
    if (!this._subject || this._subject.trim().length === 0) {
      throw new Error('Template subject cannot be empty');
    }
    
    if (this._subject.length > 200) {
      throw new Error('Template subject cannot exceed 200 characters');
    }
  }

  private validateBodyTemplate(): void {
    if (!this._bodyTemplate || this._bodyTemplate.trim().length === 0) {
      throw new Error('Template body cannot be empty');
    }
    
    if (this._bodyTemplate.length > 50000) {
      throw new Error('Template body cannot exceed 50,000 characters');
    }
  }

  private validateVariables(providedVariables?: Record<string, any>): void {
    // Validate template variable definitions
    const variableNames = new Set<string>();
    for (const variable of this._variables) {
      if (variableNames.has(variable.name)) {
        throw new Error(`Duplicate variable name: ${variable.name}`);
      }
      variableNames.add(variable.name);
      
      if (!variable.name.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
        throw new Error(`Invalid variable name: ${variable.name}`);
      }
    }

    // If provided variables are given, validate them
    if (providedVariables) {
      this.validateProvidedVariables(providedVariables);
    }
  }

  private validateProvidedVariables(variables: Record<string, any>): void {
    // Check required variables
    for (const templateVar of this._variables) {
      if (templateVar.required && !(templateVar.name in variables)) {
        throw new Error(`Required variable missing: ${templateVar.name}`);
      }
    }

    // Validate variable types and constraints
    for (const [name, value] of Object.entries(variables)) {
      const templateVar = this._variables.find(v => v.name === name);
      if (templateVar) {
        this.validateVariableValue(templateVar, value);
      }
    }
  }

  private validateVariableValue(templateVar: TemplateVariable, value: any): void {
    if (value === null || value === undefined) {
      if (templateVar.required) {
        throw new Error(`Required variable ${templateVar.name} cannot be null or undefined`);
      }
      return;
    }

    // Type validation
    switch (templateVar.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Variable ${templateVar.name} must be a string`);
        }
        this.validateStringConstraints(templateVar, value);
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(`Variable ${templateVar.name} must be a number`);
        }
        this.validateNumberConstraints(templateVar, value);
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Variable ${templateVar.name} must be a boolean`);
        }
        break;
      case 'date':
        if (!(value instanceof Date) && !this.isValidDateString(value)) {
          throw new Error(`Variable ${templateVar.name} must be a valid date`);
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          throw new Error(`Variable ${templateVar.name} must be a valid email`);
        }
        break;
      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          throw new Error(`Variable ${templateVar.name} must be a valid URL`);
        }
        break;
    }
  }

  private validateStringConstraints(templateVar: TemplateVariable, value: string): void {
    const validation = templateVar.validation;
    if (!validation) return;

    if (validation.minLength && value.length < validation.minLength) {
      throw new Error(`Variable ${templateVar.name} must be at least ${validation.minLength} characters`);
    }
    
    if (validation.maxLength && value.length > validation.maxLength) {
      throw new Error(`Variable ${templateVar.name} cannot exceed ${validation.maxLength} characters`);
    }
    
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      throw new Error(`Variable ${templateVar.name} does not match required pattern`);
    }
  }

  private validateNumberConstraints(templateVar: TemplateVariable, value: number): void {
    const validation = templateVar.validation;
    if (!validation) return;

    if (validation.min !== undefined && value < validation.min) {
      throw new Error(`Variable ${templateVar.name} must be at least ${validation.min}`);
    }
    
    if (validation.max !== undefined && value > validation.max) {
      throw new Error(`Variable ${templateVar.name} cannot exceed ${validation.max}`);
    }
  }

  private validateAttachments(): void {
    const totalSize = this._attachments.reduce((sum, att) => sum + att.size, 0);
    if (totalSize > 25 * 1024 * 1024) { // 25MB limit
      throw new Error('Total attachment size cannot exceed 25MB');
    }
  }

  // Template rendering
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    // Replace variables with actual values
    for (const [name, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{\\s*${name}\\s*}}`, 'g');
      const stringValue = this.formatVariableValue(name, value);
      rendered = rendered.replace(placeholder, stringValue);
    }
    
    // Replace missing variables with defaults
    for (const templateVar of this._variables) {
      if (!(templateVar.name in variables) && templateVar.defaultValue !== undefined) {
        const placeholder = new RegExp(`{{\\s*${templateVar.name}\\s*}}`, 'g');
        const defaultValue = this.formatVariableValue(templateVar.name, templateVar.defaultValue);
        rendered = rendered.replace(placeholder, defaultValue);
      }
    }
    
    return rendered;
  }

  private formatVariableValue(name: string, value: any): string {
    const templateVar = this._variables.find(v => v.name === name);
    
    if (value === null || value === undefined) {
      return '';
    }
    
    switch (templateVar?.type) {
      case 'date':
        const date = value instanceof Date ? value : new Date(value);
        return date.toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return value.toString();
      default:
        return String(value);
    }
  }

  // Validation helpers
  private isValidDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      subject: this._subject,
      bodyTemplate: this._bodyTemplate,
      variables: this._variables,
      attachments: this._attachments.map(att => att.toJSON()),
      metadata: this._metadata,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}