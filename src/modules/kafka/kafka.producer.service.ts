import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

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
    return this.client.send(topic, message);
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
