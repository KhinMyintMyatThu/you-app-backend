import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  NotFoundException,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { UserService } from 'src/user/user.service';
import { MessageDto } from './dto/message.dto';
import { MessageResponseType } from './types/message-response.type';
import { ExpressRequest } from 'src/user/middlewares/auth.middleware';
import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from './message.controller';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from 'src/user/entities/user.entity';
import { Message } from './entities/message.entity';

describe('MessageController', () => {
  let controller: MessageController;
  let messageService: MessageService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        MessageService,
        UserService,
        {
          provide: getModelToken(UserEntity.name),
          useValue: Model, // Mock the Mongoose Model
        },
        {
          provide: getModelToken(Message.name),
          useValue: Model,
        },
      ],
    }).compile();

    controller = module.get<MessageController>(MessageController);
    messageService = module.get<MessageService>(MessageService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('viewMessages', () => {
    it('should return messages when authorized and users exist', async () => {
      const sender = 'test@example.com';
      const receiver = 'test2@example.com';
      const mockMessages: MessageResponseType[] = [{ sender, receiver, content: 'test' }];

      jest.spyOn(userService, 'findByUsername').mockResolvedValueOnce({ email: sender } as any).mockResolvedValueOnce({ email: receiver } as any);
      jest.spyOn(messageService, 'getMessages').mockResolvedValue(mockMessages as any);
      jest.spyOn(messageService, 'buildMessageResponse').mockImplementation((message) => message);

      const req = { user: { email: sender } } as ExpressRequest;

      const result = await controller.viewMessages(req, sender, receiver);
      expect(result).toEqual(mockMessages);
    });

    it('should throw ForbiddenException when unauthorized', async () => {
      const sender = 'test@example.com';
      const receiver = 'test2@example.com';

      jest.spyOn(userService, 'findByUsername').mockResolvedValue({ email: sender } as any);

      const req = { user: { email: 'wrong@example.com' } } as ExpressRequest;

      await expect(controller.viewMessages(req, sender, receiver)).rejects.toThrow(HttpException);
      await expect(controller.viewMessages(req, sender, receiver)).rejects.toHaveProperty('status', HttpStatus.FORBIDDEN);

    });

    it('should throw NotFoundException when sender or receiver does not exist', async () => {
        const sender = 'test@example.com';
        const receiver = 'test2@example.com';
    
        jest.spyOn(userService, 'findByUsername').mockResolvedValueOnce({email: sender} as any).mockResolvedValueOnce(null);
    
        const req = { user: { email: sender } } as ExpressRequest;
    
        await expect(controller.viewMessages(req, sender, receiver)).rejects.toThrow(NotFoundException);
      });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const messageDto: MessageDto = { sender: 'test@example.com', receiver: 'test2@example.com', content: 'test' };
      const mockMessage: MessageResponseType = messageDto;

      jest.spyOn(userService, 'findByUsername').mockResolvedValueOnce({ email: messageDto.sender } as any).mockResolvedValueOnce({ email: messageDto.receiver } as any);
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockMessage as any);
      jest.spyOn(messageService, 'buildMessageResponse').mockImplementation((message) => message);

      const req = { user: { email: messageDto.sender } } as ExpressRequest;
      const result = await controller.sendMessage(req, messageDto);
      expect(result).toEqual(mockMessage);
    });

    it('should throw ForbiddenException when sending message as different user', async () => {
        const messageDto: MessageDto = { sender: 'test@example.com', receiver: 'test2@example.com', content: 'test' };

        jest.spyOn(userService, 'findByUsername').mockResolvedValue({ email: messageDto.sender } as any);

        const req = { user: { email: 'wrong@example.com' } } as ExpressRequest;

        await expect(controller.sendMessage(req, messageDto)).rejects.toThrow(HttpException);
        await expect(controller.sendMessage(req, messageDto)).rejects.toHaveProperty('status', HttpStatus.FORBIDDEN);
      });

    it('should throw NotFoundException if sender or receiver not found', async () => {
        const messageDto: MessageDto = { sender: 'test@example.com', receiver: 'test2@example.com', content: 'test' };
        jest.spyOn(userService, 'findByUsername').mockResolvedValueOnce({ email: messageDto.sender } as any).mockResolvedValueOnce(null);
        const req = { user: { email: messageDto.sender } } as ExpressRequest;
        await expect(controller.sendMessage(req, messageDto)).rejects.toThrow(NotFoundException);
      });
  });
});