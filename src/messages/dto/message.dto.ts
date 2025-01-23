import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty()
  sender: string;

  @ApiProperty()
  receiver: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  timestamp?: Date;
}
