// src/messages/messages.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './entities/message.entity';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]), // Register Message schema
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: 'amqp://localhost:5672', // RabbitMQ connection URL
      exchanges: [
        {
          name: 'default',
          type: 'direct', // Type of exchange (direct, topic, etc.)
        },
      ],
      queues: [{ name: 'notifications_queue', options: { durable: false } }],
    }),
    UserModule
  ],
  providers: [MessageService],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
