import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable graceful shutdown to release the port on hot-reload
  app.enableShutdownHooks();
  // Handle termination signals for clean exit
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
  // Global Route Prefix
  app.setGlobalPrefix('api');

  // Enable CORS for frontend integration
  app.enableCors({
    origin: '*', // Adjust this to your specific frontend URL in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = parseInt(process.env.PORT ?? '5000');
  await app.listen(port);
  console.log(`🚀 Backend is running on: http://localhost:${port}/api`);
}
bootstrap();
