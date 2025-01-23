import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class ProfileDto{
    @ApiProperty()
    readonly name: string;

    @ApiProperty()
    readonly birthday: string;

    @IsNumber()
    @ApiProperty()
    readonly height: number;

    @IsNumber()
    @ApiProperty()
    readonly weight: number;

    @ApiProperty()
    readonly interests: string[];

    @ApiProperty()
    readonly horoscope: string;

    @ApiProperty()
    readonly zodiac: string;
}