import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, EventPublisher } from '../../domain/events/domain-event.base';

@Injectable()
export class NestJsEventPublisher implements EventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    // Emit the event using NestJS EventEmitter
    this.eventEmitter.emit(event.eventType, event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}