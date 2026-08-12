import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ArticleModule } from './article/article.module';
import { ModelsModule } from './models/models.module';
import { PromptsModule } from './prompts/prompts.module';
import { ChainsModule } from './chains/chains.module';
import { AgentsModule } from './agents/agents.module';
import { MemoryModule } from './memory/memory.module';
import { RagModule } from './rag/rag.module';
import { WeatherDemoModule } from './weather-demo/weather-demo.module';
import { RagdbModule } from './ragdb/ragdb.module';
import { LanggraphModule } from './langgraph/langgraph.module';
// import { LanggraphService } from './langgraph.service';
// import { LanggraphController } from './langgraph.controller';

@Module({
  imports: [PrismaModule, UserModule, ArticleModule, ModelsModule, PromptsModule, ChainsModule, AgentsModule, MemoryModule, RagModule, WeatherDemoModule, RagdbModule, LanggraphModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
