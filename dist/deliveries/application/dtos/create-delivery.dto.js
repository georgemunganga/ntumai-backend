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
exports.AcceptDeliveryDto = exports.CancelDeliveryDto = exports.ReorderStopsDto = exports.UpdateDeliveryDto = exports.SetPaymentMethodDto = exports.AttachPricingDto = exports.CreateDeliveryDto = exports.CreateStopDto = exports.AddressDto = exports.GeoDto = exports.PaymentMethod = exports.VehicleType = exports.StopType = void 0;
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
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH_ON_DELIVERY"] = "cash_on_delivery";
    PaymentMethod["MOBILE_MONEY"] = "mobile_money";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["WALLET"] = "wallet";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
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
class CreateStopDto {
    type;
    sequence;
    contact_name;
    contact_phone;
    notes;
    geo;
    address;
}
exports.CreateStopDto = CreateStopDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: StopType }),
    (0, class_validator_1.IsEnum)(StopType),
    __metadata("design:type", String)
], CreateStopDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateStopDto.prototype, "sequence", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStopDto.prototype, "contact_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStopDto.prototype, "contact_phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStopDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: GeoDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoDto),
    __metadata("design:type", GeoDto)
], CreateStopDto.prototype, "geo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: AddressDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressDto),
    __metadata("design:type", AddressDto)
], CreateStopDto.prototype, "address", void 0);
class CreateDeliveryDto {
    vehicle_type;
    courier_comment;
    is_scheduled;
    scheduled_at;
    more_info;
    stops;
    marketplace_order_id;
    store_id;
}
exports.CreateDeliveryDto = CreateDeliveryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: VehicleType }),
    (0, class_validator_1.IsEnum)(VehicleType),
    __metadata("design:type", String)
], CreateDeliveryDto.prototype, "vehicle_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Special instructions for the courier' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDeliveryDto.prototype, "courier_comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateDeliveryDto.prototype, "is_scheduled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Scheduled delivery time (required if is_scheduled is true)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDeliveryDto.prototype, "scheduled_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional delivery information' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDeliveryDto.prototype, "more_info", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [CreateStopDto],
        description: 'Delivery stops (1 pickup + N dropoffs)',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateStopDto),
    __metadata("design:type", Array)
], CreateDeliveryDto.prototype, "stops", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional marketplace order ID for integration (makes this a marketplace delivery)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDeliveryDto.prototype, "marketplace_order_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional store ID if this is a vendor delivery',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDeliveryDto.prototype, "store_id", void 0);
class AttachPricingDto {
    calc_payload;
    calc_sig;
}
exports.AttachPricingDto = AttachPricingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pricing calculator payload' }),
    __metadata("design:type", Object)
], AttachPricingDto.prototype, "calc_payload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'HMAC signature from pricing calculator' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachPricingDto.prototype, "calc_sig", void 0);
class SetPaymentMethodDto {
    method;
}
exports.SetPaymentMethodDto = SetPaymentMethodDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PaymentMethod }),
    (0, class_validator_1.IsEnum)(PaymentMethod),
    __metadata("design:type", String)
], SetPaymentMethodDto.prototype, "method", void 0);
class UpdateDeliveryDto {
    vehicle_type;
    courier_comment;
    is_scheduled;
    scheduled_at;
    more_info;
}
exports.UpdateDeliveryDto = UpdateDeliveryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: VehicleType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(VehicleType),
    __metadata("design:type", String)
], UpdateDeliveryDto.prototype, "vehicle_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDeliveryDto.prototype, "courier_comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateDeliveryDto.prototype, "is_scheduled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateDeliveryDto.prototype, "scheduled_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDeliveryDto.prototype, "more_info", void 0);
class ReorderStopsDto {
    order;
}
exports.ReorderStopsDto = ReorderStopsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        description: 'Array of stop IDs in desired order',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ReorderStopsDto.prototype, "order", void 0);
class CancelDeliveryDto {
    reason;
}
exports.CancelDeliveryDto = CancelDeliveryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelDeliveryDto.prototype, "reason", void 0);
class AcceptDeliveryDto {
    estimated_pickup_time;
}
exports.AcceptDeliveryDto = AcceptDeliveryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptDeliveryDto.prototype, "estimated_pickup_time", void 0);
//# sourceMappingURL=create-delivery.dto.js.map