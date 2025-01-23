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

  const mockMessage = {
    sender: 'testSender',
    receiver: 'testReceiver',
    content: 'testContent',
  };

  const mockMessageDocument = {
    ...mockMessage,
    _id: 'testId',
    save: jest.fn().mockResolvedValue(mockMessage),
    toObject: jest.fn().mockReturnValue(mockMessage),
  } as unknown as Message;

  const mockMessages = [mockMessageDocument];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getModelToken(Message.name),
          useValue: {
            // new: jest.fn().mockReturnValue(mockMessageDocument),
            constructor: jest.fn().mockReturnValue(mockMessageDocument),
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockMessages),
            }),
            save: jest.fn().mockResolvedValue(mockMessage),
          },
        },
        {
          provide: AmqpConnection,
          useValue: {
            publish: jest.fn(),
          },
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

  describe('sendMessage', () => {
    it('should create and save a new message', async () => {
      const saveSpy = jest.spyOn(messageModel.prototype, 'save').mockResolvedValue(mockMessage);

      await service.sendMessage(
          mockMessage.sender,
          mockMessage.receiver,
          mockMessage.content,
      );

      expect(messageModel).toHaveBeenCalledWith(mockMessage); // Correct way to check instantiation
      expect(saveSpy).toHaveBeenCalled();
      saveSpy.mockRestore();
  });

    it('should publish a message to RabbitMQ', async () => {
        const saveSpy = jest.spyOn(messageModel.prototype, 'save').mockResolvedValue(mockMessage);

        await service.sendMessage(
            mockMessage.sender,
            mockMessage.receiver,
            mockMessage.content,
        );

        expect(amqpConnection.publish).toHaveBeenCalledWith(
            'default',
            'message_received',
            mockMessage,
        );
        saveSpy.mockRestore();
    });

    it('should return the saved message', async () => {
        const saveSpy = jest.spyOn(messageModel.prototype, 'save').mockResolvedValue(mockMessage);
        const result = await service.sendMessage(
            mockMessage.sender,
            mockMessage.receiver,
            mockMessage.content,
        );
        expect(result).toEqual(mockMessage);
        saveSpy.mockRestore();
    });
});

  describe('getMessages', () => {
    it('should retrieve messages between two users and sort by timestamp', async () => {
      const findMock = messageModel.find as jest.Mock;
      const sortMock = jest.fn().mockResolvedValue(mockMessages);
      findMock.mockReturnValue({ sort: sortMock });

      const sender = 'user1';
      const receiver = 'user2';
      await service.getMessages(sender, receiver);

      expect(messageModel.find).toHaveBeenCalledWith({
        $or: [
          { sender, receiver },
          { sender: receiver, receiver: sender },
        ],
      });
      expect(sortMock).toHaveBeenCalledWith({ timestamp: 1 });
    });

    it('should return the messages', async () => {
      const result = await service.getMessages('testSender', 'testReceiver');
      expect(result).toEqual(mockMessages);
    });
  });

  describe('buildMessageResponse', () => {
    it('should return message response', () => {
      const result = service.buildMessageResponse(mockMessageDocument);
      expect(result).toEqual({
        sender: mockMessage.sender,
        receiver: mockMessage.receiver,
        content: mockMessage.content,
      });
    });
  });
});
