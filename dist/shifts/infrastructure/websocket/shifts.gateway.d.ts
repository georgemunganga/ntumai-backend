import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class ShiftsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private activeRiders;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleShiftStart(data: {
        riderId: string;
        shiftId: string;
        location?: any;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleShiftEnd(data: {
        riderId: string;
        shiftId: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleShiftPause(data: {
        riderId: string;
        shiftId: string;
        reason?: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleShiftResume(data: {
        riderId: string;
        shiftId: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleLocationUpdate(data: {
        riderId: string;
        location: any;
    }, client: Socket): {
        success: boolean;
    };
    handleDispatchSubscribe(data: any, client: Socket): {
        success: boolean;
        activeRiders: {
            riderId: string;
            location: any;
        }[];
        count: number;
    };
    emitShiftReminder(riderId: string, message: string): void;
    emitShiftAlert(riderId: string, alert: any): void;
    broadcastRiderOnline(riderId: string, location?: any): void;
    broadcastRiderOffline(riderId: string): void;
    getActiveRidersCount(): number;
    getActiveRidersLocations(): Array<{
        riderId: string;
        location: any;
    }>;
    broadcastToActiveRiders(event: string, data: any): void;
}
