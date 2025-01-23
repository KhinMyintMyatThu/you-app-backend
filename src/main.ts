import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Create Swagger config
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    // .addTag('api')  // Add custom tags for grouping routes
    .build();

  // Create Swagger document
  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI at '/api'
  SwaggerModule.setup('apidoc', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
