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
var MatchingGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let MatchingGateway = MatchingGateway_1 = class MatchingGateway {
    server;
    logger = new common_1.Logger(MatchingGateway_1.name);
    riderSockets = new Map();
    customerSockets = new Map();
    handleConnection(client) {
        this.logger.log(`Client connected to matching: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from matching: ${client.id}`);
        for (const [riderId, socketId] of this.riderSockets.entries()) {
            if (socketId === client.id) {
                this.riderSockets.delete(riderId);
                this.logger.log(`Rider ${riderId} went offline`);
            }
        }
        for (const [customerId, socketId] of this.customerSockets.entries()) {
            if (socketId === client.id) {
                this.customerSockets.delete(customerId);
            }
        }
    }
    handleRiderOnline(data, client) {
        const { riderId, location } = data;
        this.riderSockets.set(riderId, client.id);
        client.join(`rider:${riderId}`);
        this.logger.log(`Rider ${riderId} is now online`);
        return {
            success: true,
            message: 'Rider marked as online',
            riderId,
        };
    }
    handleRiderOffline(data, client) {
        const { riderId } = data;
        this.riderSockets.delete(riderId);
        client.leave(`rider:${riderId}`);
        this.logger.log(`Rider ${riderId} is now offline`);
        return {
            success: true,
            message: 'Rider marked as offline',
        };
    }
    handleCustomerSubscribe(data, client) {
        const { customerId, bookingId } = data;
        this.customerSockets.set(customerId, client.id);
        client.join(`customer:${customerId}`);
        if (bookingId) {
            client.join(`booking:${bookingId}`);
        }
        this.logger.log(`Customer ${customerId} subscribed to matching updates`);
        return {
            success: true,
            message: 'Subscribed to matching updates',
        };
    }
    handleRiderLocationUpdate(data, client) {
        const { riderId, location } = data;
        this.server.emit('rider:location:update', {
            riderId,
            location,
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
    emitBookingRequest(riderId, bookingData) {
        const socketId = this.riderSockets.get(riderId);
        if (socketId) {
            this.server.to(`rider:${riderId}`).emit('booking:request', {
                ...bookingData,
                timestamp: new Date().toISOString(),
            });
            this.logger.log(`Booking request sent to rider ${riderId}`);
            return true;
        }
        this.logger.warn(`Rider ${riderId} is not online`);
        return false;
    }
    emitBookingAccepted(customerId, bookingData) {
        this.server.to(`customer:${customerId}`).emit('booking:accepted', {
            ...bookingData,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Booking accepted notification sent to customer ${customerId}`);
    }
    emitBookingRejected(customerId, bookingId, reason) {
        this.server.to(`customer:${customerId}`).emit('booking:rejected', {
            bookingId,
            reason,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Booking rejected notification sent to customer ${customerId}`);
    }
    emitMatchingInProgress(customerId, bookingId) {
        this.server.to(`customer:${customerId}`).emit('matching:in_progress', {
            bookingId,
            message: 'Finding a rider for you...',
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Matching in progress notification sent to customer ${customerId}`);
    }
    emitMatchingFailed(customerId, bookingId, reason) {
        this.server.to(`customer:${customerId}`).emit('matching:failed', {
            bookingId,
            reason,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Matching failed notification sent to customer ${customerId}`);
    }
    emitRiderArrival(bookingId, location) {
        this.server.to(`booking:${bookingId}`).emit('rider:arrived', {
            bookingId,
            location,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Rider arrival notification sent for booking ${bookingId}`);
    }
    isRiderOnline(riderId) {
        return this.riderSockets.has(riderId);
    }
    getOnlineRidersCount() {
        return this.riderSockets.size;
    }
    getOnlineRiderIds() {
        return Array.from(this.riderSockets.keys());
    }
};
exports.MatchingGateway = MatchingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MatchingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('rider:online'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MatchingGateway.prototype, "handleRiderOnline", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('rider:offline'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MatchingGateway.prototype, "handleRiderOffline", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('customer:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MatchingGateway.prototype, "handleCustomerSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('rider:location'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MatchingGateway.prototype, "handleRiderLocationUpdate", null);
exports.MatchingGateway = MatchingGateway = MatchingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/matching',
        cors: {
            origin: '*',
        },
    })
], MatchingGateway);
//# sourceMappingURL=matching.gateway.js.map