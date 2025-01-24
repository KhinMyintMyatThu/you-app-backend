import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from './user/middlewares/auth.middleware';
import { MessageModule } from './messages/message.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    UserModule,
    MongooseModule.forRoot('mongodb://localhost/youappdb'),
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: 'amqp://localhost:5672', // RabbitMQ connection URL
      exchanges: [
        {
          name: 'default', 
          type: 'direct', // Type of exchange (direct, topic, etc.)
        },
      ],
      queues: [
        { name: 'notifications_queue', options: { durable: false } },
      ],
    }),
    MessageModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'api/login', method: RequestMethod.ALL }, // Exclude login route
        { path: 'api/register', method: RequestMethod.ALL }, // Exclude register route
      )
      .forRoutes({
        path: '*',
        method: RequestMethod.ALL,
      });
  }
}
