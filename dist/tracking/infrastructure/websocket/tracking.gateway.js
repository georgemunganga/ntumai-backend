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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TrackingGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let TrackingGateway = TrackingGateway_1 = class TrackingGateway {
    server;
    logger = new common_1.Logger(TrackingGateway_1.name);
    activeSubscriptions = new Map();
    handleConnection(client) {
        this.logger.log(`Client connected to tracking: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from tracking: ${client.id}`);
        this.activeSubscriptions.forEach((clients, deliveryId) => {
            clients.delete(client.id);
            if (clients.size === 0) {
                this.activeSubscriptions.delete(deliveryId);
            }
        });
    }
    handleSubscribeDelivery(data, client) {
        const { deliveryId } = data;
        if (!this.activeSubscriptions.has(deliveryId)) {
            this.activeSubscriptions.set(deliveryId, new Set());
        }
        this.activeSubscriptions.get(deliveryId).add(client.id);
        client.join(`delivery:${deliveryId}`);
        this.logger.log(`Client ${client.id} subscribed to delivery ${deliveryId}`);
        return { success: true, message: `Subscribed to delivery ${deliveryId}` };
    }
    handleUnsubscribeDelivery(data, client) {
        const { deliveryId } = data;
        if (this.activeSubscriptions.has(deliveryId)) {
            this.activeSubscriptions.get(deliveryId).delete(client.id);
        }
        client.leave(`delivery:${deliveryId}`);
        this.logger.log(`Client ${client.id} unsubscribed from delivery ${deliveryId}`);
        return {
            success: true,
            message: `Unsubscribed from delivery ${deliveryId}`,
        };
    }
    handleSubscribeBooking(data, client) {
        const { bookingId } = data;
        client.join(`booking:${bookingId}`);
        this.logger.log(`Client ${client.id} subscribed to booking ${bookingId}`);
        return { success: true, message: `Subscribed to booking ${bookingId}` };
    }
    handleUnsubscribeBooking(data, client) {
        const { bookingId } = data;
        client.leave(`booking:${bookingId}`);
        this.logger.log(`Client ${client.id} unsubscribed from booking ${bookingId}`);
        return { success: true, message: `Unsubscribed from booking ${bookingId}` };
    }
    emitLocationUpdate(deliveryId, location) {
        this.server.to(`delivery:${deliveryId}`).emit('location:update', {
            deliveryId,
            location,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Location update emitted for delivery ${deliveryId}`);
    }
    emitStatusUpdate(deliveryId, status, eventType) {
        this.server.to(`delivery:${deliveryId}`).emit('status:update', {
            deliveryId,
            status,
            eventType,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Status update emitted for delivery ${deliveryId}: ${eventType}`);
    }
    emitBookingUpdate(bookingId, data) {
        this.server.to(`booking:${bookingId}`).emit('booking:update', {
            bookingId,
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Booking update emitted for ${bookingId}`);
    }
    emitEtaUpdate(deliveryId, eta) {
        this.server.to(`delivery:${deliveryId}`).emit('eta:update', {
            deliveryId,
            eta,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`ETA update emitted for delivery ${deliveryId}`);
    }
    getSubscribersCount(deliveryId) {
        return this.activeSubscriptions.get(deliveryId)?.size || 0;
    }
};
exports.TrackingGateway = TrackingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TrackingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:delivery'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleSubscribeDelivery", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:delivery'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleUnsubscribeDelivery", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:booking'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleSubscribeBooking", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:booking'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleUnsubscribeBooking", null);
exports.TrackingGateway = TrackingGateway = TrackingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/tracking',
        cors: {
            origin: '*',
        },
    })
], TrackingGateway);
//# sourceMappingURL=tracking.gateway.js.map