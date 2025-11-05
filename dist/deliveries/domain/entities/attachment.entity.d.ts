export declare enum AttachmentType {
    PHOTO = "photo",
    DOCUMENT = "document",
    PROOF_OF_DELIVERY = "proof_of_delivery"
}
export declare class Attachment {
    readonly id: string;
    readonly delivery_id: string;
    type: AttachmentType;
    filename: string;
    url: string | null;
    size_bytes: number | null;
    mime_type: string | null;
    uploaded_by_user_id: string;
    readonly created_at: Date;
    constructor(id: string, delivery_id: string, type: AttachmentType, filename: string, url: string | null, size_bytes: number | null, mime_type: string | null, uploaded_by_user_id: string, created_at: Date);
    static create(params: {
        id: string;
        delivery_id: string;
        type: AttachmentType;
        filename: string;
        uploaded_by_user_id: string;
        url?: string;
        size_bytes?: number;
        mime_type?: string;
    }): Attachment;
    finalize(url: string, size_bytes: number, mime_type: string): void;
}
