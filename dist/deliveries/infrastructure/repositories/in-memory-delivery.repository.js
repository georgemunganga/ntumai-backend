"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryDeliveryRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryDeliveryRepository = class InMemoryDeliveryRepository {
    deliveries = new Map();
    async create(delivery) {
        this.deliveries.set(delivery.id, delivery);
        return delivery;
    }
    async findById(id) {
        return this.deliveries.get(id) || null;
    }
    async findAll(filters, pagination) {
        let results = Array.from(this.deliveries.values());
        if (filters.created_by_user_id) {
            results = results.filter((d) => d.created_by_user_id === filters.created_by_user_id);
        }
        if (filters.rider_id) {
            results = results.filter((d) => d.rider_id === filters.rider_id);
        }
        if (filters.placed_by_role) {
            results = results.filter((d) => d.placed_by_role === filters.placed_by_role);
        }
        if (filters.vehicle_type) {
            results = results.filter((d) => d.vehicle_type === filters.vehicle_type);
        }
        if (filters.order_status) {
            results = results.filter((d) => d.order_status === filters.order_status);
        }
        if (filters.from) {
            results = results.filter((d) => d.created_at >= filters.from);
        }
        if (filters.to) {
            results = results.filter((d) => d.created_at <= filters.to);
        }
        results.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        const total = results.length;
        const totalPages = Math.ceil(total / pagination.size);
        const start = (pagination.page - 1) * pagination.size;
        const end = start + pagination.size;
        const data = results.slice(start, end);
        return {
            data,
            total,
            page: pagination.page,
            size: pagination.size,
            totalPages,
        };
    }
    async update(id, updates) {
        const existing = this.deliveries.get(id);
        if (!existing) {
            throw new Error('Delivery not found');
        }
        const updated = Object.assign(Object.create(Object.getPrototypeOf(existing)), existing, updates, { updated_at: new Date() });
        this.deliveries.set(id, updated);
        return updated;
    }
    async delete(id) {
        this.deliveries.delete(id);
    }
    async findNearby(lat, lng, radius_km, vehicle_type) {
        const results = Array.from(this.deliveries.values()).filter((delivery) => {
            if (vehicle_type && delivery.vehicle_type !== vehicle_type) {
                return false;
            }
            if (delivery.order_status !== 'booked') {
                return false;
            }
            const pickup = delivery.stops.find((s) => s.type === 'pickup');
            if (!pickup || !pickup.geo) {
                return false;
            }
            const distance = this.calculateDistance(lat, lng, pickup.geo.lat, pickup.geo.lng);
            return distance <= radius_km;
        });
        return results;
    }
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(degrees) {
        return (degrees * Math.PI) / 180;
    }
};
exports.InMemoryDeliveryRepository = InMemoryDeliveryRepository;
exports.InMemoryDeliveryRepository = InMemoryDeliveryRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryDeliveryRepository);
//# sourceMappingURL=in-memory-delivery.repository.js.map