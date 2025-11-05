import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class MatchingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private riderSockets;
    private customerSockets;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleRiderOnline(data: {
        riderId: string;
        location?: any;
    }, client: Socket): {
        success: boolean;
        message: string;
        riderId: string;
    };
    handleRiderOffline(data: {
        riderId: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleCustomerSubscribe(data: {
        customerId: string;
        bookingId?: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleRiderLocationUpdate(data: {
        riderId: string;
        location: any;
    }, client: Socket): {
        success: boolean;
    };
    emitBookingRequest(riderId: string, bookingData: any): boolean;
    emitBookingAccepted(customerId: string, bookingData: any): void;
    emitBookingRejected(customerId: string, bookingId: string, reason?: string): void;
    emitMatchingInProgress(customerId: string, bookingId: string): void;
    emitMatchingFailed(customerId: string, bookingId: string, reason: string): void;
    emitRiderArrival(bookingId: string, location: any): void;
    isRiderOnline(riderId: string): boolean;
    getOnlineRidersCount(): number;
    getOnlineRiderIds(): string[];
}
