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
var ShiftsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let ShiftsGateway = ShiftsGateway_1 = class ShiftsGateway {
    server;
    logger = new common_1.Logger(ShiftsGateway_1.name);
    activeRiders = new Map();
    handleConnection(client) {
        this.logger.log(`Client connected to shifts: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from shifts: ${client.id}`);
        for (const [riderId, data] of this.activeRiders.entries()) {
            if (data.socketId === client.id) {
                this.activeRiders.delete(riderId);
                this.broadcastRiderOffline(riderId);
            }
        }
    }
    handleShiftStart(data, client) {
        const { riderId, shiftId, location } = data;
        this.activeRiders.set(riderId, { socketId: client.id, location });
        client.join(`rider:${riderId}`);
        client.join('active-riders');
        this.logger.log(`Rider ${riderId} started shift ${shiftId}`);
        this.server.to('dispatch').emit('shift:started', {
            riderId,
            shiftId,
            location,
            timestamp: new Date().toISOString(),
        });
        return { success: true, message: 'Shift started' };
    }
    handleShiftEnd(data, client) {
        const { riderId, shiftId } = data;
        this.activeRiders.delete(riderId);
        client.leave(`rider:${riderId}`);
        client.leave('active-riders');
        this.logger.log(`Rider ${riderId} ended shift ${shiftId}`);
        this.server.to('dispatch').emit('shift:ended', {
            riderId,
            shiftId,
            timestamp: new Date().toISOString(),
        });
        return { success: true, message: 'Shift ended' };
    }
    handleShiftPause(data, client) {
        const { riderId, shiftId, reason } = data;
        this.logger.log(`Rider ${riderId} paused shift ${shiftId}`);
        this.server.to('dispatch').emit('shift:paused', {
            riderId,
            shiftId,
            reason,
            timestamp: new Date().toISOString(),
        });
        return { success: true, message: 'Shift paused' };
    }
    handleShiftResume(data, client) {
        const { riderId, shiftId } = data;
        this.logger.log(`Rider ${riderId} resumed shift ${shiftId}`);
        this.server.to('dispatch').emit('shift:resumed', {
            riderId,
            shiftId,
            timestamp: new Date().toISOString(),
        });
        return { success: true, message: 'Shift resumed' };
    }
    handleLocationUpdate(data, client) {
        const { riderId, location } = data;
        const riderData = this.activeRiders.get(riderId);
        if (riderData) {
            riderData.location = location;
            this.activeRiders.set(riderId, riderData);
        }
        this.server.to('dispatch').emit('rider:location', {
            riderId,
            location,
            timestamp: new Date().toISOString(),
        });
        return { success: true };
    }
    handleDispatchSubscribe(data, client) {
        client.join('dispatch');
        this.logger.log(`Dispatch client ${client.id} subscribed`);
        const activeRiders = Array.from(this.activeRiders.entries()).map(([riderId, data]) => ({
            riderId,
            location: data.location,
        }));
        return {
            success: true,
            activeRiders,
            count: activeRiders.length,
        };
    }
    emitShiftReminder(riderId, message) {
        this.server.to(`rider:${riderId}`).emit('shift:reminder', {
            message,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Shift reminder sent to rider ${riderId}`);
    }
    emitShiftAlert(riderId, alert) {
        this.server.to(`rider:${riderId}`).emit('shift:alert', {
            ...alert,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Shift alert sent to rider ${riderId}`);
    }
    broadcastRiderOnline(riderId, location) {
        this.server.to('dispatch').emit('rider:online', {
            riderId,
            location,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastRiderOffline(riderId) {
        this.server.to('dispatch').emit('rider:offline', {
            riderId,
            timestamp: new Date().toISOString(),
        });
    }
    getActiveRidersCount() {
        return this.activeRiders.size;
    }
    getActiveRidersLocations() {
        return Array.from(this.activeRiders.entries()).map(([riderId, data]) => ({
            riderId,
            location: data.location,
        }));
    }
    broadcastToActiveRiders(event, data) {
        this.server.to('active-riders').emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Broadcast ${event} to all active riders`);
    }
};
exports.ShiftsGateway = ShiftsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ShiftsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('shift:start'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ShiftsGateway.prototype, "handleShiftStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('shift:end'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ShiftsGateway.prototype, "handleShiftEnd", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('shift:pause'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ShiftsGateway.prototype, "handleShiftPause", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('shift:resume'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ShiftsGateway.prototype, "handleShiftResume", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('location:update'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ShiftsGateway.prototype, "handleLocationUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('dispatch:subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ShiftsGateway.prototype, "handleDispatchSubscribe", null);
exports.ShiftsGateway = ShiftsGateway = ShiftsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/shifts',
        cors: {
            origin: '*',
        },
    })
], ShiftsGateway);
//# sourceMappingURL=shifts.gateway.js.map