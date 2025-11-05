import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class DeliveriesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
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
    emitDeliveryCreated(userId: string, delivery: any): void;
    emitDeliveryStatusUpdate(deliveryId: string, status: string, details?: any): void;
    emitRiderAssigned(deliveryId: string, riderInfo: any): void;
    emitPickupStarted(deliveryId: string, location: any): void;
    emitPickupCompleted(deliveryId: string, location: any, attachments?: any[]): void;
    emitInTransit(deliveryId: string, currentStop: number, totalStops: number): void;
    emitArrivingAtDropoff(deliveryId: string, stopIndex: number, eta: string): void;
    emitDropoffCompleted(deliveryId: string, stopIndex: number, attachments?: any[]): void;
    emitDeliveryCompleted(deliveryId: string, summary: any): void;
    emitDeliveryCancelled(deliveryId: string, reason: string, cancelledBy: string): void;
    emitPaymentStatusUpdate(deliveryId: string, paymentStatus: string): void;
    emitEtaUpdate(deliveryId: string, eta: string, stopIndex?: number): void;
}
