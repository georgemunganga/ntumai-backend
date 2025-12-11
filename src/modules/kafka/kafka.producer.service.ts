import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class KafkaProducerService {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly client: ClientKafka,
  ) {}

  async onModuleInit() {
    this.client.subscribeToResponseOf('task.created');
    this.client.subscribeToResponseOf('task.assignment.proposed');
    await this.client.connect();
  }

  async sendMessage(topic: string, message: any) {
    return lastValueFrom(this.client.send(topic, message));
  }

  async produce(topic: string, message: any) {
    return this.sendMessage(topic, message);
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
