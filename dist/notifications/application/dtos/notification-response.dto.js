"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsListResponseDto = exports.NotificationsListMetaDto = exports.NotificationResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class NotificationResponseDto {
    id;
    title;
    message;
    type;
    isRead;
    createdAt;
    updatedAt;
}
exports.NotificationResponseDto = NotificationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.NotificationType }),
    __metadata("design:type", String)
], NotificationResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], NotificationResponseDto.prototype, "isRead", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'date-time' }),
    __metadata("design:type", Date)
], NotificationResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'date-time' }),
    __metadata("design:type", Date)
], NotificationResponseDto.prototype, "updatedAt", void 0);
class NotificationsListMetaDto {
    page;
    limit;
    total;
    hasMore;
}
exports.NotificationsListMetaDto = NotificationsListMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], NotificationsListMetaDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], NotificationsListMetaDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], NotificationsListMetaDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], NotificationsListMetaDto.prototype, "hasMore", void 0);
class NotificationsListResponseDto {
    notifications;
    meta;
    unreadCount;
}
exports.NotificationsListResponseDto = NotificationsListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [NotificationResponseDto] }),
    __metadata("design:type", Array)
], NotificationsListResponseDto.prototype, "notifications", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: NotificationsListMetaDto }),
    __metadata("design:type", NotificationsListMetaDto)
], NotificationsListResponseDto.prototype, "meta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], NotificationsListResponseDto.prototype, "unreadCount", void 0);
//# sourceMappingURL=notification-response.dto.js.map