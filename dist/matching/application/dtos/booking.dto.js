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
exports.BookingCompletedEventDto = exports.BookingProgressEventDto = exports.BookingAcceptedEventDto = exports.BookingOfferedEventDto = exports.CreateBookingResponseDto = exports.BookingResponseDto = exports.RiderInfoDto = exports.UpdateProgressDto = exports.RespondToOfferDto = exports.CancelBookingDto = exports.EditBookingDto = exports.CreateBookingDto = exports.BookingStopDto = exports.GeoCoordinatesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class GeoCoordinatesDto {
    lat;
    lng;
}
exports.GeoCoordinatesDto = GeoCoordinatesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: -15.41 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GeoCoordinatesDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.28 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GeoCoordinatesDto.prototype, "lng", void 0);
class BookingStopDto {
    sequence;
    geo;
    address;
}
exports.BookingStopDto = BookingStopDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BookingStopDto.prototype, "sequence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoCoordinatesDto),
    __metadata("design:type", GeoCoordinatesDto)
], BookingStopDto.prototype, "geo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123 Main St, Lusaka' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingStopDto.prototype, "address", void 0);
class CreateBookingDto {
    delivery_id;
    vehicle_type;
    pickup;
    dropoffs;
    customer_user_id;
    customer_name;
    customer_phone;
    metadata;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'del_abc123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "delivery_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'motorbike',
        enum: ['motorbike', 'bicycle', 'walking', 'truck'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['motorbike', 'bicycle', 'walking', 'truck']),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "vehicle_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BookingStopDto),
    __metadata("design:type", BookingStopDto)
], CreateBookingDto.prototype, "pickup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BookingStopDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BookingStopDto),
    __metadata("design:type", Array)
], CreateBookingDto.prototype, "dropoffs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'usr_123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "customer_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "customer_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+260972827372' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "customer_phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "metadata", void 0);
class EditBookingDto {
    pickup;
    dropoffs;
    metadata;
}
exports.EditBookingDto = EditBookingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BookingStopDto),
    __metadata("design:type", BookingStopDto)
], EditBookingDto.prototype, "pickup", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [BookingStopDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BookingStopDto),
    __metadata("design:type", Array)
], EditBookingDto.prototype, "dropoffs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], EditBookingDto.prototype, "metadata", void 0);
class CancelBookingDto {
    reason;
}
exports.CancelBookingDto = CancelBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user_request' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelBookingDto.prototype, "reason", void 0);
class RespondToOfferDto {
    rider_user_id;
    decision;
}
exports.RespondToOfferDto = RespondToOfferDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'usr_r_101' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RespondToOfferDto.prototype, "rider_user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'accept', enum: ['accept', 'decline'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['accept', 'decline']),
    __metadata("design:type", String)
], RespondToOfferDto.prototype, "decision", void 0);
class UpdateProgressDto {
    stage;
}
exports.UpdateProgressDto = UpdateProgressDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'arrived_pickup',
        enum: [
            'en_route',
            'arrived_pickup',
            'picked_up',
            'en_route_dropoff',
            'delivered',
        ],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)([
        'en_route',
        'arrived_pickup',
        'picked_up',
        'en_route_dropoff',
        'delivered',
    ]),
    __metadata("design:type", String)
], UpdateProgressDto.prototype, "stage", void 0);
class RiderInfoDto {
    user_id;
    name;
    vehicle;
    phone;
    rating;
    eta_min;
}
exports.RiderInfoDto = RiderInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RiderInfoDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RiderInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RiderInfoDto.prototype, "vehicle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RiderInfoDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], RiderInfoDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], RiderInfoDto.prototype, "eta_min", void 0);
class BookingResponseDto {
    booking_id;
    delivery_id;
    status;
    vehicle_type;
    pickup;
    dropoffs;
    rider;
    wait_times;
    can_user_edit;
    created_at;
    updated_at;
}
exports.BookingResponseDto = BookingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "delivery_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "vehicle_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", BookingStopDto)
], BookingResponseDto.prototype, "pickup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BookingStopDto] }),
    __metadata("design:type", Array)
], BookingResponseDto.prototype, "dropoffs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], BookingResponseDto.prototype, "rider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], BookingResponseDto.prototype, "wait_times", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], BookingResponseDto.prototype, "can_user_edit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "created_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "updated_at", void 0);
class CreateBookingResponseDto {
    booking_id;
    status;
    estimated_search_sec;
    offer_expires_at;
}
exports.CreateBookingResponseDto = CreateBookingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreateBookingResponseDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreateBookingResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreateBookingResponseDto.prototype, "estimated_search_sec", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CreateBookingResponseDto.prototype, "offer_expires_at", void 0);
class BookingOfferedEventDto {
    booking_id;
    candidates;
}
exports.BookingOfferedEventDto = BookingOfferedEventDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingOfferedEventDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [RiderInfoDto] }),
    __metadata("design:type", Array)
], BookingOfferedEventDto.prototype, "candidates", void 0);
class BookingAcceptedEventDto {
    booking_id;
    rider;
}
exports.BookingAcceptedEventDto = BookingAcceptedEventDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingAcceptedEventDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", RiderInfoDto)
], BookingAcceptedEventDto.prototype, "rider", void 0);
class BookingProgressEventDto {
    booking_id;
    status;
    timestamp;
}
exports.BookingProgressEventDto = BookingProgressEventDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingProgressEventDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingProgressEventDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingProgressEventDto.prototype, "timestamp", void 0);
class BookingCompletedEventDto {
    booking_id;
    delivery_id;
    wait_times;
}
exports.BookingCompletedEventDto = BookingCompletedEventDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingCompletedEventDto.prototype, "booking_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingCompletedEventDto.prototype, "delivery_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], BookingCompletedEventDto.prototype, "wait_times", void 0);
//# sourceMappingURL=booking.dto.js.map