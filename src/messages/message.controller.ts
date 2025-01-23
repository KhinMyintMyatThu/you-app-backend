// src/messages/messages.controller.ts
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
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('api') // Base URL
export class MessageController {
  constructor(
    private readonly messagesService: MessageService,
    private readonly usersService: UserService,
  ) {}

  // View Messages between sender and receiver
  @Get('viewMessages')
  @ApiOperation({ summary: 'View Messages' }) // Operation summary
  @ApiResponse({ status: 200, description: 'Success' }) // Response details
  @ApiResponse({
    status: 404,
    description: 'Not allowed to retrieve the messages',
  })
  @ApiHeader({
    name: 'x-access-token',
    description: 'Access token',
    required: false,
  })
  async viewMessages(
    @Request() request: ExpressRequest,
    @Query('sender') sender: string,
    @Query('receiver') receiver: string,
  ): Promise<MessageResponseType[]> {
    const senderUser = await this.usersService.findByUsername(sender);
    const receiverUser = await this.usersService.findByUsername(receiver);

    if (request.user.email != senderUser.email) {
      throw new HttpException(
        'Not allowed to retrieve the messages',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!senderUser || !receiverUser) {
      throw new NotFoundException('Sender or Receiver not found');
    }

    // Get messages between the sender and receiver
    const messages = await this.messagesService.getMessages(sender, receiver);

    return messages.map(this.messagesService.buildMessageResponse);
  }

  // Send Message
  @Post('sendMessage')
  @ApiOperation({ summary: 'Send Message' }) // Operation summary
  @ApiResponse({ status: 201, description: 'Created' }) // Response details
  @ApiResponse({
    status: 404,
    description: 'Not allowed to send the messages',
  })
  @ApiHeader({
    name: 'x-access-token',
    description: 'Access token',
    required: false,
  })
  async sendMessage(
    @Request() request: ExpressRequest,
    @Body() messageDto: MessageDto,
  ): Promise<MessageResponseType> {
    const { sender, receiver, content } = messageDto;

    const senderUser = await this.usersService.findByUsername(sender);
    const receiverUser = await this.usersService.findByUsername(receiver);

    if (request.user.email != senderUser.email) {
      throw new HttpException(
        'Not allowed to send the messages',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!senderUser || !receiverUser) {
      throw new NotFoundException('Sender or Receiver not found');
    }

    // Send and store the message, and notify the receiver
    const message = await this.messagesService.sendMessage(
      sender,
      receiver,
      content,
    );

    return this.messagesService.buildMessageResponse(message);
  }
}
