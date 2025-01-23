import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './entities/message.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MessageResponseType } from './types/message-response.type';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private readonly amqpConnection: AmqpConnection, // Inject AmqpConnection
  ) {}

  async sendMessage(sender: string, receiver: string, content: string) {
    const newMessage = new this.messageModel({ sender, receiver, content });
    const savedMessage = await newMessage.save();

    // Use the amqpConnection to send a message to RabbitMQ
    this.amqpConnection.publish('default', 'message_received', {
      sender,
      receiver,
      content,
    });

    return savedMessage;
  }

  async getMessages(sender: string, receiver: string) {
    return this.messageModel
      .find({
        $or: [
          { sender, receiver },
          { sender: receiver, receiver: sender },
        ],
      })
      .sort({ timestamp: 1 });
  }

  buildMessageResponse(message: Message): MessageResponseType {
    return {
      sender: message.sender,
      receiver: message.receiver,
      content: message.content
    }
  }
}
