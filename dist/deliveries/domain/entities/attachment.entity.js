"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attachment = exports.AttachmentType = void 0;
var AttachmentType;
(function (AttachmentType) {
    AttachmentType["PHOTO"] = "photo";
    AttachmentType["DOCUMENT"] = "document";
    AttachmentType["PROOF_OF_DELIVERY"] = "proof_of_delivery";
})(AttachmentType || (exports.AttachmentType = AttachmentType = {}));
class Attachment {
    id;
    delivery_id;
    type;
    filename;
    url;
    size_bytes;
    mime_type;
    uploaded_by_user_id;
    created_at;
    constructor(id, delivery_id, type, filename, url, size_bytes, mime_type, uploaded_by_user_id, created_at) {
        this.id = id;
        this.delivery_id = delivery_id;
        this.type = type;
        this.filename = filename;
        this.url = url;
        this.size_bytes = size_bytes;
        this.mime_type = mime_type;
        this.uploaded_by_user_id = uploaded_by_user_id;
        this.created_at = created_at;
    }
    static create(params) {
        return new Attachment(params.id, params.delivery_id, params.type, params.filename, params.url || null, params.size_bytes || null, params.mime_type || null, params.uploaded_by_user_id, new Date());
    }
    finalize(url, size_bytes, mime_type) {
        this.url = url;
        this.size_bytes = size_bytes;
        this.mime_type = mime_type;
    }
}
exports.Attachment = Attachment;
//# sourceMappingURL=attachment.entity.js.map