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
var DeliveriesGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveriesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let DeliveriesGateway = DeliveriesGateway_1 = class DeliveriesGateway {
    server;
    logger = new common_1.Logger(DeliveriesGateway_1.name);
    handleConnection(client) {
        this.logger.log(`Client connected to deliveries: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from deliveries: ${client.id}`);
    }
    handleSubscribeDelivery(data, client) {
        const { deliveryId } = data;
        client.join(`delivery:${deliveryId}`);
        this.logger.log(`Client ${client.id} subscribed to delivery ${deliveryId}`);
        return { success: true, message: `Subscribed to delivery ${deliveryId}` };
    }
    handleUnsubscribeDelivery(data, client) {
        const { deliveryId } = data;
        client.leave(`delivery:${deliveryId}`);
        this.logger.log(`Client ${client.id} unsubscribed from delivery ${deliveryId}`);
        return {
            success: true,
            message: `Unsubscribed from delivery ${deliveryId}`,
        };
    }
    emitDeliveryCreated(userId, delivery) {
        this.server.to(`user:${userId}`).emit('delivery:created', {
            delivery,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Delivery created notification sent to user ${userId}`);
    }
    emitDeliveryStatusUpdate(deliveryId, status, details) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:status_update', {
            deliveryId,
            status,
            details,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Delivery ${deliveryId} status updated to ${status}`);
    }
    emitRiderAssigned(deliveryId, riderInfo) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:rider_assigned', {
            deliveryId,
            rider: riderInfo,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Rider assigned to delivery ${deliveryId}`);
    }
    emitPickupStarted(deliveryId, location) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:pickup_started', {
            deliveryId,
            location,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Pickup started for delivery ${deliveryId}`);
    }
    emitPickupCompleted(deliveryId, location, attachments) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:pickup_completed', {
            deliveryId,
            location,
            attachments,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Pickup completed for delivery ${deliveryId}`);
    }
    emitInTransit(deliveryId, currentStop, totalStops) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:in_transit', {
            deliveryId,
            currentStop,
            totalStops,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Delivery ${deliveryId} in transit (stop ${currentStop}/${totalStops})`);
    }
    emitArrivingAtDropoff(deliveryId, stopIndex, eta) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:arriving', {
            deliveryId,
            stopIndex,
            eta,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Delivery ${deliveryId} arriving at stop ${stopIndex}`);
    }
    emitDropoffCompleted(deliveryId, stopIndex, attachments) {
        this.server
            .to(`delivery:${deliveryId}`)
            .emit('delivery:dropoff_completed', {
            deliveryId,
            stopIndex,
            attachments,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Dropoff completed for delivery ${deliveryId} stop ${stopIndex}`);
    }
    emitDeliveryCompleted(deliveryId, summary) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:completed', {
            deliveryId,
            summary,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Delivery ${deliveryId} completed`);
    }
    emitDeliveryCancelled(deliveryId, reason, cancelledBy) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:cancelled', {
            deliveryId,
            reason,
            cancelledBy,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Delivery ${deliveryId} cancelled by ${cancelledBy}`);
    }
    emitPaymentStatusUpdate(deliveryId, paymentStatus) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:payment_update', {
            deliveryId,
            paymentStatus,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Payment status updated for delivery ${deliveryId}: ${paymentStatus}`);
    }
    emitEtaUpdate(deliveryId, eta, stopIndex) {
        this.server.to(`delivery:${deliveryId}`).emit('delivery:eta_update', {
            deliveryId,
            eta,
            stopIndex,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`ETA updated for delivery ${deliveryId}`);
    }
};
exports.DeliveriesGateway = DeliveriesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], DeliveriesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:delivery'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], DeliveriesGateway.prototype, "handleSubscribeDelivery", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:delivery'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], DeliveriesGateway.prototype, "handleUnsubscribeDelivery", null);
exports.DeliveriesGateway = DeliveriesGateway = DeliveriesGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/deliveries',
        cors: {
            origin: '*',
        },
    })
], DeliveriesGateway);
//# sourceMappingURL=deliveries.gateway.js.map