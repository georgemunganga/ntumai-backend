export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public readonly eventType: string;

  constructor(eventType: string) {
    this.occurredOn = new Date();
    this.eventId = this.generateEventId();
    this.eventType = eventType;
  }

  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  abstract getAggregateId(): string;
  abstract getEventData(): any;
}

export interface DomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void> | void;
}

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}