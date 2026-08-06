import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ArticleModule } from './article/article.module';
import { ModelsModule } from './models/models.module';
import { PromptsModule } from './prompts/prompts.module';
import { ChainsModule } from './chains/chains.module';

@Module({
  imports: [PrismaModule, UserModule, ArticleModule, ModelsModule, PromptsModule, ChainsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
