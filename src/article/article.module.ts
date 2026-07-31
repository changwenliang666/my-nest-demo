import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [ArticleController],
  providers: [ArticleService],
  imports: [PrismaModule],
})
export class ArticleModule {}
