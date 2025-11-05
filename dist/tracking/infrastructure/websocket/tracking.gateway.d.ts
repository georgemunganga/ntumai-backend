import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private activeSubscriptions;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeDelivery(data: {
        deliveryId: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleUnsubscribeDelivery(data: {
        deliveryId: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleSubscribeBooking(data: {
        bookingId: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    handleUnsubscribeBooking(data: {
        bookingId: string;
    }, client: Socket): {
        success: boolean;
        message: string;
    };
    emitLocationUpdate(deliveryId: string, location: any): void;
    emitStatusUpdate(deliveryId: string, status: string, eventType: string): void;
    emitBookingUpdate(bookingId: string, data: any): void;
    emitEtaUpdate(deliveryId: string, eta: string): void;
    getSubscribersCount(deliveryId: string): number;
}
