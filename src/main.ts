import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json as jsonParser } from 'body-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));

  const uploadsDir = join(process.cwd(), 'uploads', 'chat');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const jobsUploadsDir = join(process.cwd(), 'uploads', 'jobs');
  if (!fs.existsSync(jobsUploadsDir)) {
    fs.mkdirSync(jobsUploadsDir, { recursive: true });
  }
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8100,http://localhost:8084,http://localhost:8085')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.use(jsonParser({ limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(
          validationErrors.map((error) => ({
            path: error.property,
            message: Object.values(error.constraints).join(', '),
          })),
        );
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('BabyNounu API')
    .setDescription('API pour la plateforme BabyNounu — mise en relation parents/familles et prestataires (garde d\'enfants, ménage, cuisine)')
    .setVersion('2.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  const HOST_URL = process.env.HOST_URL;
  await app.listen(port);

  console.log(`\n🚀 BabyNounu API running on  ${HOST_URL}:${port}`);
  console.log(`📚 Swagger docs at ${HOST_URL}:${port}/api/docs`);
}

bootstrap();
