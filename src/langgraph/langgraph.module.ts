import { Module } from '@nestjs/common';
import { LanggraphController } from './langgraph.controller';
import { LanggraphService } from './langgraph.service';
import { ArticleService } from './article.service';
import { ReactAgentService } from './react-agent.service';
import { ParallelService } from './parallel.service';
import { RoutingService } from './routing.service';

@Module({
  controllers: [LanggraphController],
  providers: [LanggraphService, ArticleService, ReactAgentService, ParallelService, RoutingService]
})
export class LanggraphModule {
}
