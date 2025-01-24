import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MessageService } from './message.service';
import { Message } from './entities/message.entity';
import { Model } from 'mongoose';

describe('MessageService', () => {
  let service: MessageService;
  let messageModel: Model<Message>;
  let amqpConnection: AmqpConnection;

  beforeEach(async () => {
    const mockMessageModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnThis(),
      save: jest.fn(),
    };
    const mockAmqpConnection = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
        {
          provide: AmqpConnection,
          useValue: mockAmqpConnection,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    messageModel = module.get<Model<Message>>(getModelToken(Message.name));
    amqpConnection = module.get<AmqpConnection>(AmqpConnection);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });  

  describe('getMessages', () => {
    it('should retrieve messages sorted by timestamp', async () => {
      const sender = 'John';
      const receiver = 'Doe';
      const messages = [
        { sender: 'John', receiver: 'Doe', content: 'Hello' },
        { sender: 'Doe', receiver: 'John', content: 'Hi' },
      ];

      jest.spyOn(messageModel, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(messages),
      } as any);

      const result = await service.getMessages(sender, receiver);

      expect(messageModel.find).toHaveBeenCalledWith({
        $or: [
          { sender, receiver },
          { sender: receiver, receiver: sender },
        ],
      });
      expect(result).toEqual(messages);
    });
  });

  describe('buildMessageResponse', () => {
    it('should build a message response', () => {
      const message = {
        sender: 'John',
        receiver: 'Doe',
        content: 'Hello, world!',
      } as Message;

      const result = service.buildMessageResponse(message);

      expect(result).toEqual({
        sender: 'John',
        receiver: 'Doe',
        content: 'Hello, world!',
      });
    });
  });
});
