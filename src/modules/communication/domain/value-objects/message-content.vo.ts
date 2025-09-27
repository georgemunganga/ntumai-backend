export interface MessageAttachmentData {
  filename: string;
  content: Buffer | string;
  contentType: string;
  size?: number;
}

export class MessageAttachment {
  private constructor(
    private readonly _filename: string,
    private readonly _content: Buffer | string,
    private readonly _contentType: string,
    private readonly _size: number,
  ) {}

  static create(data: MessageAttachmentData): MessageAttachment {
    if (!data.filename || data.filename.trim().length === 0) {
      throw new Error('Attachment filename cannot be empty');
    }

    if (!data.content) {
      throw new Error('Attachment content cannot be empty');
    }

    if (!data.contentType || data.contentType.trim().length === 0) {
      throw new Error('Attachment content type cannot be empty');
    }

    const size = data.size || (Buffer.isBuffer(data.content) ? data.content.length : Buffer.byteLength(data.content.toString()));
    
    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (size > maxSize) {
      throw new Error(`Attachment size (${size} bytes) exceeds maximum allowed size (${maxSize} bytes)`);
    }

    return new MessageAttachment(
      data.filename.trim(),
      data.content,
      data.contentType.trim(),
      size,
    );
  }

  get filename(): string {
    return this._filename;
  }

  get content(): Buffer | string {
    return this._content;
  }

  get contentType(): string {
    return this._contentType;
  }

  get size(): number {
    return this._size;
  }

  get sizeInMB(): number {
    return this._size / (1024 * 1024);
  }
}

export interface MessageContentData {
  body: string;
  subject?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: MessageAttachmentData[];
}

export class MessageContent {
  private constructor(
    private readonly _body: string,
    private readonly _subject?: string,
    private readonly _templateId?: string,
    private readonly _templateData?: Record<string, any>,
    private readonly _attachments?: MessageAttachment[],
  ) {}

  static create(data: MessageContentData): MessageContent {
    if (!data.body || data.body.trim().length === 0) {
      throw new Error('Message body cannot be empty');
    }

    // Validate body length (max 4096 characters for SMS compatibility)
    if (data.body.length > 4096) {
      throw new Error(`Message body length (${data.body.length}) exceeds maximum allowed length (4096)`);
    }

    // Validate subject if provided
    if (data.subject && data.subject.length > 255) {
      throw new Error(`Subject length (${data.subject.length}) exceeds maximum allowed length (255)`);
    }

    // Validate template data
    if (data.templateData && typeof data.templateData !== 'object') {
      throw new Error('Template data must be an object');
    }

    // Create attachments if provided
    const attachments = data.attachments?.map(att => MessageAttachment.create(att));

    // Validate total attachment size
    if (attachments && attachments.length > 0) {
      const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
      const maxTotalSize = 50 * 1024 * 1024; // 50MB total
      if (totalSize > maxTotalSize) {
        throw new Error(`Total attachment size (${totalSize} bytes) exceeds maximum allowed size (${maxTotalSize} bytes)`);
      }
    }

    return new MessageContent(
      data.body.trim(),
      data.subject?.trim(),
      data.templateId?.trim(),
      data.templateData,
      attachments,
    );
  }

  get body(): string {
    return this._body;
  }

  get subject(): string | undefined {
    return this._subject;
  }

  get templateId(): string | undefined {
    return this._templateId;
  }

  get templateData(): Record<string, any> | undefined {
    return this._templateData;
  }

  get attachments(): MessageAttachment[] | undefined {
    return this._attachments;
  }

  get hasAttachments(): boolean {
    return this._attachments !== undefined && this._attachments.length > 0;
  }

  get totalAttachmentSize(): number {
    return this._attachments?.reduce((sum, att) => sum + att.size, 0) || 0;
  }

  get isTemplate(): boolean {
    return this._templateId !== undefined;
  }

  // Create a copy with template data applied
  withTemplateData(data: Record<string, any>): MessageContent {
    return new MessageContent(
      this._body,
      this._subject,
      this._templateId,
      { ...this._templateData, ...data },
      this._attachments,
    );
  }

  // Create a copy with different body (useful for template rendering)
  withBody(body: string): MessageContent {
    return new MessageContent(
      body,
      this._subject,
      this._templateId,
      this._templateData,
      this._attachments,
    );
  }
}