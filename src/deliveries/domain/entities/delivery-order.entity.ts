import { Stop } from './stop.entity';
import { Attachment } from './attachment.entity';

export enum OrderStatus {
  BOOKED = 'booked',
  DELIVERY = 'delivery',
}

export enum VehicleType {
  MOTORBIKE = 'motorbike',
  BICYCLE = 'bicycle',
  WALKING = 'walking',
  TRUCK = 'truck',
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  MOBILE_MONEY = 'mobile_money',
  CARD = 'card',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
}

export interface PaymentInfo {
  method: PaymentMethod | null;
  calc_payload: any | null;
  calc_sig: string | null;
  currency: string | null;
  amount: number | null;
  expires_at: Date | null;
}

export class DeliveryOrder {
  constructor(
    public readonly id: string,
    public readonly created_by_user_id: string,
    public readonly placed_by_role: string,
    public vehicle_type: VehicleType,
    public courier_comment: string | null,
    public is_scheduled: boolean,
    public scheduled_at: Date | null,
    public order_status: OrderStatus,
    public payment: PaymentInfo,
    public stops: Stop[],
    public attachments: Attachment[],
    public more_info: string | null,
    public rider_id: string | null,
    public ready_token: string | null,
    public ready_token_expires_at: Date | null,
    public readonly created_at: Date,
    public updated_at: Date,
  ) {}

  static create(params: {
    id: string;
    created_by_user_id: string;
    placed_by_role: string;
    vehicle_type: VehicleType;
    courier_comment?: string;
    is_scheduled?: boolean;
    scheduled_at?: Date;
    more_info?: string;
  }): DeliveryOrder {
    return new DeliveryOrder(
      params.id,
      params.created_by_user_id,
      params.placed_by_role,
      params.vehicle_type,
      params.courier_comment || null,
      params.is_scheduled || false,
      params.scheduled_at || null,
      OrderStatus.BOOKED,
      {
        method: null,
        calc_payload: null,
        calc_sig: null,
        currency: null,
        amount: null,
        expires_at: null,
      },
      [],
      [],
      params.more_info || null,
      null,
      null,
      null,
      new Date(),
      new Date(),
    );
  }

  addStop(stop: Stop): void {
    this.stops.push(stop);
    this.updated_at = new Date();
  }

  removeStop(stopId: string): void {
    this.stops = this.stops.filter((s) => s.id !== stopId);
    this.updated_at = new Date();
  }

  updateStop(stopId: string, updates: Partial<Stop>): void {
    const stopIndex = this.stops.findIndex((s) => s.id === stopId);
    if (stopIndex !== -1) {
      const existing = this.stops[stopIndex];
      this.stops[stopIndex] = Object.assign(
        Object.create(Object.getPrototypeOf(existing)),
        existing,
        updates,
      );
      this.updated_at = new Date();
    }
  }

  reorderStops(stopIds: string[]): void {
    const reordered: Stop[] = [];
    for (const id of stopIds) {
      const stop = this.stops.find((s) => s.id === id);
      if (stop) {
        reordered.push(stop);
      }
    }
    this.stops = reordered;
    this.updated_at = new Date();
  }

  attachPricing(
    calc_payload: any,
    calc_sig: string,
    currency: string,
    amount: number,
    expires_at: Date,
  ): void {
    this.payment = {
      ...this.payment,
      calc_payload,
      calc_sig,
      currency,
      amount,
      expires_at,
    };
    this.updated_at = new Date();
  }

  setPaymentMethod(method: PaymentMethod): void {
    this.payment = {
      ...this.payment,
      method,
    };
    this.updated_at = new Date();
  }

  setReadyToken(token: string, expiresAt: Date): void {
    this.ready_token = token;
    this.ready_token_expires_at = expiresAt;
    this.updated_at = new Date();
  }

  assignRider(riderId: string): void {
    this.rider_id = riderId;
    this.updated_at = new Date();
  }

  markAsDelivery(): void {
    this.order_status = OrderStatus.DELIVERY;
    this.updated_at = new Date();
  }

  isPricingValid(): boolean {
    if (!this.payment.calc_sig || !this.payment.expires_at) {
      return false;
    }
    return new Date() < this.payment.expires_at;
  }

  isReadyTokenValid(): boolean {
    if (!this.ready_token || !this.ready_token_expires_at) {
      return false;
    }
    return new Date() < this.ready_token_expires_at;
  }

  canSubmit(): boolean {
    return (
      this.payment.method !== null &&
      this.payment.calc_sig !== null &&
      this.isPricingValid() &&
      this.stops.length >= 2
    );
  }
}
