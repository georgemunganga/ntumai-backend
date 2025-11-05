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
exports.CalculatePriceResponseDto = exports.SignatureFieldsDto = exports.PriceConstraintsDto = exports.VehicleLimitsDto = exports.PriceBreakdownDto = exports.CalculatePriceDto = exports.LegDto = exports.StopDto = exports.AddressDto = exports.GeoDto = exports.ServiceLevel = exports.VehicleType = exports.StopType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var StopType;
(function (StopType) {
    StopType["PICKUP"] = "pickup";
    StopType["DROPOFF"] = "dropoff";
})(StopType || (exports.StopType = StopType = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["MOTORBIKE"] = "motorbike";
    VehicleType["BICYCLE"] = "bicycle";
    VehicleType["WALKING"] = "walking";
    VehicleType["TRUCK"] = "truck";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var ServiceLevel;
(function (ServiceLevel) {
    ServiceLevel["STANDARD"] = "standard";
    ServiceLevel["EXPRESS"] = "express";
    ServiceLevel["PREMIUM"] = "premium";
})(ServiceLevel || (exports.ServiceLevel = ServiceLevel = {}));
class GeoDto {
    lat;
    lng;
}
exports.GeoDto = GeoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: -15.41 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], GeoDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.28 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], GeoDto.prototype, "lng", void 0);
class AddressDto {
    line1;
    line2;
    city;
    province;
    country;
    postal_code;
}
exports.AddressDto = AddressDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "line1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "line2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "province", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddressDto.prototype, "postal_code", void 0);
class StopDto {
    type;
    sequence;
    geo;
    address;
}
exports.StopDto = StopDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: StopType }),
    (0, class_validator_1.IsEnum)(StopType),
    __metadata("design:type", String)
], StopDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StopDto.prototype, "sequence", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: GeoDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoDto),
    __metadata("design:type", GeoDto)
], StopDto.prototype, "geo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: AddressDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressDto),
    __metadata("design:type", AddressDto)
], StopDto.prototype, "address", void 0);
class LegDto {
    from;
    to;
    distance_km;
    duration_min;
}
exports.LegDto = LegDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], LegDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], LegDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 7.4 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], LegDto.prototype, "distance_km", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20.0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], LegDto.prototype, "duration_min", void 0);
class CalculatePriceDto {
    currency;
    region;
    vehicle_type;
    service_level;
    is_scheduled;
    scheduled_at;
    stops;
    legs;
    weight_kg;
    volume_l;
    promo_code;
    gift_card_hint;
}
exports.CalculatePriceDto = CalculatePriceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ZMW' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CalculatePriceDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ZM-LSK' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CalculatePriceDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: VehicleType }),
    (0, class_validator_1.IsEnum)(VehicleType),
    __metadata("design:type", String)
], CalculatePriceDto.prototype, "vehicle_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ServiceLevel, default: ServiceLevel.STANDARD }),
    (0, class_validator_1.IsEnum)(ServiceLevel),
    __metadata("design:type", String)
], CalculatePriceDto.prototype, "service_level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CalculatePriceDto.prototype, "is_scheduled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CalculatePriceDto.prototype, "scheduled_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StopDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StopDto),
    __metadata("design:type", Array)
], CalculatePriceDto.prototype, "stops", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [LegDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LegDto),
    __metadata("design:type", Array)
], CalculatePriceDto.prototype, "legs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CalculatePriceDto.prototype, "weight_kg", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 8 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CalculatePriceDto.prototype, "volume_l", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'WELCOME10' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CalculatePriceDto.prototype, "promo_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'GC-ABCD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CalculatePriceDto.prototype, "gift_card_hint", void 0);
class PriceBreakdownDto {
    base;
    distance;
    duration;
    multistop;
    vehicle_surcharge;
    service_level;
    small_order_fee;
    platform_fee;
    surge;
    promo_discount;
    gift_card_preview;
    tax;
}
exports.PriceBreakdownDto = PriceBreakdownDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "base", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "distance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "multistop", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "vehicle_surcharge", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "service_level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "small_order_fee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "platform_fee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "surge", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "promo_discount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "gift_card_preview", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceBreakdownDto.prototype, "tax", void 0);
class VehicleLimitsDto {
    max_weight_kg;
    max_volume_l;
}
exports.VehicleLimitsDto = VehicleLimitsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], VehicleLimitsDto.prototype, "max_weight_kg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], VehicleLimitsDto.prototype, "max_volume_l", void 0);
class PriceConstraintsDto {
    max_stops;
    max_schedule_ahead_hours;
    vehicle_limits;
}
exports.PriceConstraintsDto = PriceConstraintsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceConstraintsDto.prototype, "max_stops", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PriceConstraintsDto.prototype, "max_schedule_ahead_hours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: VehicleLimitsDto }),
    __metadata("design:type", VehicleLimitsDto)
], PriceConstraintsDto.prototype, "vehicle_limits", void 0);
class SignatureFieldsDto {
    alg;
    key_id;
    issued_at;
    ttl_seconds;
    canon_hash;
}
exports.SignatureFieldsDto = SignatureFieldsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SignatureFieldsDto.prototype, "alg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SignatureFieldsDto.prototype, "key_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SignatureFieldsDto.prototype, "issued_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SignatureFieldsDto.prototype, "ttl_seconds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SignatureFieldsDto.prototype, "canon_hash", void 0);
class CalculatePriceResponseDto {
    ok;
    currency;
    region;
    vehicle_type;
    service_level;
    distance_km;
    duration_min;
    rule_ids;
    breakdown;
    subtotal;
    total;
    constraints;
    advisories;
    expires_at;
    sig;
    sig_fields;
}
exports.CalculatePriceResponseDto = CalculatePriceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CalculatePriceResponseDto.prototype, "ok", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CalculatePriceResponseDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CalculatePriceResponseDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CalculatePriceResponseDto.prototype, "vehicle_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CalculatePriceResponseDto.prototype, "service_level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CalculatePriceResponseDto.prototype, "distance_km", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CalculatePriceResponseDto.prototype, "duration_min", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], CalculatePriceResponseDto.prototype, "rule_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: PriceBreakdownDto }),
    __metadata("design:type", PriceBreakdownDto)
], CalculatePriceResponseDto.prototype, "breakdown", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CalculatePriceResponseDto.prototype, "subtotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CalculatePriceResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: PriceConstraintsDto }),
    __metadata("design:type", PriceConstraintsDto)
], CalculatePriceResponseDto.prototype, "constraints", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], CalculatePriceResponseDto.prototype, "advisories", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CalculatePriceResponseDto.prototype, "expires_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CalculatePriceResponseDto.prototype, "sig", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: SignatureFieldsDto }),
    __metadata("design:type", SignatureFieldsDto)
], CalculatePriceResponseDto.prototype, "sig_fields", void 0);
//# sourceMappingURL=calculate-price.dto.js.map