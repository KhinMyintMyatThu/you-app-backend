import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    @ApiProperty()
    readonly username: string;

    @IsNotEmpty()
    @IsEmail()
    @ApiProperty()
    readonly email: string;
    
    @IsNotEmpty()
    @ApiProperty()
    readonly password: string;
}