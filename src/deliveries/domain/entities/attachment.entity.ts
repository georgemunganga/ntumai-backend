export enum AttachmentType {
  PHOTO = 'photo',
  DOCUMENT = 'document',
  PROOF_OF_DELIVERY = 'proof_of_delivery',
}

export class Attachment {
  constructor(
    public readonly id: string,
    public readonly delivery_id: string,
    public type: AttachmentType,
    public filename: string,
    public url: string | null,
    public size_bytes: number | null,
    public mime_type: string | null,
    public uploaded_by_user_id: string,
    public readonly created_at: Date,
  ) {}

  static create(params: {
    id: string;
    delivery_id: string;
    type: AttachmentType;
    filename: string;
    uploaded_by_user_id: string;
    url?: string;
    size_bytes?: number;
    mime_type?: string;
  }): Attachment {
    return new Attachment(
      params.id,
      params.delivery_id,
      params.type,
      params.filename,
      params.url || null,
      params.size_bytes || null,
      params.mime_type || null,
      params.uploaded_by_user_id,
      new Date(),
    );
  }

  finalize(url: string, size_bytes: number, mime_type: string): void {
    (this as any).url = url;
    (this as any).size_bytes = size_bytes;
    (this as any).mime_type = mime_type;
  }
}
