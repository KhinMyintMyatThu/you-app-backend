import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { UserService } from '../user/user.service';
import { NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { MessageController } from './message.controller';
import { UserEntity } from '../user/entities/user.entity';
import { Message } from './entities/message.entity';
import { HydratedDocument } from 'mongoose';
import { ExpressRequest } from '../user/middlewares/auth.middleware';
import { Document } from 'mongoose';

describe('MessageController', () => {
  let messageController: MessageController;
  let messageService: MessageService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        {
          provide: MessageService,
          useValue: {
            getMessages: jest.fn(),
            buildMessageResponse: jest.fn(),
            sendMessage: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findByUsername: jest.fn(),
          },
        },
      ],
    }).compile();

    messageController = module.get<MessageController>(MessageController);
    messageService = module.get<MessageService>(MessageService);
    userService = module.get<UserService>(UserService);
  });

  const mockMessageDocument = (
    data: Partial<Message>,
  ): HydratedDocument<Message> => {
    return {
      ...data,
      _id: 'mockId',
      __v: 0,
      toObject: jest.fn().mockReturnValue(data),
      toJSON: jest.fn().mockReturnValue(data),
    } as unknown as HydratedDocument<Message>;
  };

  describe('viewMessages', () => {
    it('should return messages if sender and receiver are valid', async () => {
      const mockRequest = {
        user: { email: 'sender@example.com' },
      } as ExpressRequest;
      const sender = 'sender';
      const receiver = 'receiver';
      // Create mock messages
      const mockMessages = [
        mockMessageDocument({
          content: 'Hello!',
          sender: 'sender',
          receiver: 'receiver',
        }),
        mockMessageDocument({
          content: 'Hi!',
          sender: 'sender',
          receiver: 'receiver',
        }),
      ];

      jest
        .spyOn(userService, 'findByUsername')
        .mockImplementation((username) => {
          if (username === 'sender') {
            return Promise.resolve({
              email: 'sender@example.com',
            } as UserEntity);
          }
          if (username === 'receiver') {
            return Promise.resolve({
              email: 'receiver@example.com',
            } as UserEntity);
          }
          return Promise.resolve(null); // For cases where the user is not found
        });

      jest.spyOn(messageService, 'getMessages').mockResolvedValue(mockMessages);
      jest
        .spyOn(messageService, 'buildMessageResponse')
        .mockImplementation((message) => message);

      const result = await messageController.viewMessages(
        mockRequest,
        sender,
        receiver,
      );

      expect(result).toEqual(mockMessages);
      expect(userService.findByUsername).toHaveBeenCalledTimes(2);
      expect(messageService.getMessages).toHaveBeenCalledWith(sender, receiver);
    });

    it('should throw a NotFoundException if sender or receiver does not exist', async () => {
      // Mock userService.findByUsername to return null
      jest.spyOn(userService, 'findByUsername').mockResolvedValue({
        email: 'other@example.com',
        username: 'other', 
        password: 'hashedPassword',
        profile: {
          name: '',
          birthday: '',
          height: 0,
          weight: 0,
          interests: [],
          horoscope: '',
          zodiac: '',
        },
      });

      const mockRequest = {
        user: { email: 'sender@example.com' },
      } as ExpressRequest;

      await expect(
        messageController.viewMessages(
          mockRequest, // Pass the mocked user
          'sender',
          'receiver',
        ),
      ).rejects.toThrow(
        new HttpException(
          'Not allowed to retrieve the messages',
          HttpStatus.FORBIDDEN,
        ),
      );
    });

    it('should throw a HttpException if the sender email does not match', async () => {
      jest.spyOn(userService, 'findByUsername').mockResolvedValue({
        email: 'other@example.com',
        username: 'other',
        password: 'hashedPassword',
        profile: {
          name: '',
          birthday: '',
          height: 0,
          weight: 0,
          interests: [],
          horoscope: '',
          zodiac: '',
        },
      });

      const mockRequest = {
        user: { email: 'sender@example.com' },
      } as ExpressRequest;

      await expect(
        messageController.viewMessages(mockRequest, 'sender', 'receiver'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('sendMessage', () => {
    it('should send and return a message if sender and receiver are valid', async () => {
      const mockRequest = {
        user: { email: 'sender@example.com' },
      } as ExpressRequest;
      const messageDto = {
        sender: 'sender',
        receiver: 'receiver',
        content: 'Hello!',
      };
      const mockMessage = { id: 1, content: 'Hello!' } as Message;

      function createMockMessage(
        overrides: Partial<Message> = {},
      ): Document<unknown, {}, Message> & Message & { __v: number } {
        return {
          _id: 'mocked-id',
          content: 'Default content',
          __v: 0,
          ...overrides,
          $assertPopulated: jest.fn(),
          $clearModifiedPaths: jest.fn(),
          $clone: jest.fn(),
        } as any;
      }

      jest
        .spyOn(userService, 'findByUsername')
        .mockImplementation((username) => {
          if (username === 'sender') {
            return Promise.resolve({
              email: 'sender@example.com',
            } as UserEntity);
          }
          if (username === 'receiver') {
            return Promise.resolve({
              email: 'receiver@example.com',
            } as UserEntity);
          }
          return Promise.resolve(null); // For cases where the user is not found
        });

      jest
        .spyOn(messageService, 'sendMessage')
        .mockResolvedValue(createMockMessage(mockMessage));
      jest
        .spyOn(messageService, 'buildMessageResponse')
        .mockImplementation((message) => message);

      const result = await messageController.sendMessage(
        mockRequest,
        messageDto,
      );

      expect(userService.findByUsername).toHaveBeenCalledTimes(2);
      expect(messageService.sendMessage).toHaveBeenCalledWith(
        messageDto.sender,
        messageDto.receiver,
        messageDto.content,
      );
    });


    it('should throw a HttpException if the sender email does not match', async () => {
      jest.spyOn(userService, 'findByUsername').mockResolvedValue({
        email: 'other@example.com',
        username: 'other',
        password: 'hashedPassword',
        profile: {
          name: '',
          birthday: '',
          height: 0,
          weight: 0,
          interests: [],
          horoscope: '',
          zodiac: '',
        },
      });
      const mockRequest = {
        user: { email: 'sender@example.com' },
      } as ExpressRequest;

      await expect(
        messageController.sendMessage(mockRequest, {
          sender: 'sender',
          receiver: 'receiver',
          content: 'Hello!',
        }),
      ).rejects.toThrow(HttpException);
    });
  });
});
