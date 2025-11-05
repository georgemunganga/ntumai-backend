export enum OrderType {
  MARKETPLACE = 'marketplace',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface OrderProps {
  id: string;
  user_id: string;
  type: OrderType;
  status: OrderStatus;
  marketplace_order_id: string | null;
  delivery_id: string | null;
  booking_id: string | null;
  total_amount: number;
  currency: string;
  items_summary: string;
  delivery_address: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export class Order {
  private constructor(private props: OrderProps) {}

  static fromPersistence(data: OrderProps): Order {
    return new Order(data);
  }

  get id(): string {
    return this.props.id;
  }

  get user_id(): string {
    return this.props.user_id;
  }

  get type(): OrderType {
    return this.props.type;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get total_amount(): number {
    return this.props.total_amount;
  }

  toJSON(): OrderProps {
    return { ...this.props };
  }
}
