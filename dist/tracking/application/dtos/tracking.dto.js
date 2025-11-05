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
exports.TrackingTimelineDto = exports.TrackingEventResponseDto = exports.CreateTrackingEventDto = exports.GeoLocationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class GeoLocationDto {
    lat;
    lng;
}
exports.GeoLocationDto = GeoLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: -15.41 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GeoLocationDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.28 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GeoLocationDto.prototype, "lng", void 0);
class CreateTrackingEventDto {
    booking_id;
    delivery_id;
    event_type;
    location;
    rider_user_id;
}
exports.CreateTrackingEventDto = CreateTrackingEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'bkg_abc123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrackingEventDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'del_xyz789' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrackingEventDto.prototype, "delivery_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'location_update',
        enum: [
            'booking_created',
            'rider_assigned',
            'en_route_to_pickup',
            'arrived_at_pickup',
            'picked_up',
            'en_route_to_dropoff',
            'arrived_at_dropoff',
            'delivered',
            'cancelled',
            'location_update',
        ],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)([
        'booking_created',
        'rider_assigned',
        'en_route_to_pickup',
        'arrived_at_pickup',
        'picked_up',
        'en_route_to_dropoff',
        'arrived_at_dropoff',
        'delivered',
        'cancelled',
        'location_update',
    ]),
    __metadata("design:type", String)
], CreateTrackingEventDto.prototype, "event_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoLocationDto),
    __metadata("design:type", GeoLocationDto)
], CreateTrackingEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'usr_r_101' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTrackingEventDto.prototype, "rider_user_id", void 0);
class TrackingEventResponseDto {
    id;
    booking_id;
    delivery_id;
    event_type;
    location;
    rider_user_id;
    timestamp;
}
exports.TrackingEventResponseDto = TrackingEventResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrackingEventResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrackingEventResponseDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrackingEventResponseDto.prototype, "delivery_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrackingEventResponseDto.prototype, "event_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], TrackingEventResponseDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], TrackingEventResponseDto.prototype, "rider_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrackingEventResponseDto.prototype, "timestamp", void 0);
class TrackingTimelineDto {
    booking_id;
    delivery_id;
    events;
    current_location;
    current_status;
}
exports.TrackingTimelineDto = TrackingTimelineDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrackingTimelineDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrackingTimelineDto.prototype, "delivery_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TrackingEventResponseDto] }),
    __metadata("design:type", Array)
], TrackingTimelineDto.prototype, "events", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], TrackingTimelineDto.prototype, "current_location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TrackingTimelineDto.prototype, "current_status", void 0);
//# sourceMappingURL=tracking.dto.js.map