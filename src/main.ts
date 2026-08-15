import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';

loadEnv({ path: resolve(process.cwd(), 'src/.env') });
loadEnv({ path: resolve(process.cwd(), '.env') });
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
