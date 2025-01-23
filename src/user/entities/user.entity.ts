import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { hash } from 'bcrypt';
import { ProfileEntity } from './profile.entity';

@Schema()
export class UserEntity {
  @Prop()
  email: string;

  @Prop()
  username: string;

  @Prop({ select: false })
  password: string;

  @Prop({type: ProfileEntity})
  profile: ProfileEntity
}

// create user entity schema
export const UserEntitySchema = SchemaFactory.createForClass(UserEntity);

UserEntitySchema.pre<UserEntity>('save', async function (next: Function) {
    this.password = await hash(this.password, 10);
    next();
});
