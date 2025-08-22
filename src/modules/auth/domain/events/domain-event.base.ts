export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType: string;

  constructor(eventType: string, occurredAt?: Date) {
    this.eventType = eventType;
    this.occurredAt = occurredAt || new Date();
    this.eventId = this.generateEventId();
  }

  private generateEventId(): string {
    // In production, use a proper UUID library
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  abstract getAggregateId(): string;
  abstract getEventData(): Record<string, any>;
}