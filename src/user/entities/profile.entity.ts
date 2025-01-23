import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class ProfileEntity {
  @Prop()
  name: string;

  @Prop()
  birthday: string;

  @Prop({ type: Number })
  height: number;

  @Prop({ type: Number })
  weight: number;

  @Prop({ type: [String] })
  interests: string[];

  @Prop()
  horoscope: string;

  @Prop()
  zodiac: string;
}
