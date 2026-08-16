import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LanggraphService } from './langgraph.service';
import { ArticleService } from './article.service';
import { ReactAgentService } from './react-agent.service';
import { RoutingService } from './routing.service';
import { ParallelService } from './parallel.service';

@Controller('langgraph')
export class LanggraphController {
    constructor(
        private readonly langgraphService: LanggraphService,
        private readonly articleService: ArticleService, 
        private readonly reactAgentService: ReactAgentService, 
        private readonly routingService: RoutingService,
        private readonly parallelService: ParallelService
    ) { }
    @Post('simple-chat')
    simpleChat(@Body() body: { message: string, threadId: string }) {
        return this.langgraphService.simpleChat(body.message, body.threadId);
    }
    @Get('get-history')
    getHistory(@Query() query: { threadId: string }) {
        return this.langgraphService.getHistory(query.threadId);
    }

    @Post('generate-article')
    generateArticle(@Body() body: { article: string }) {
        return this.articleService.generateArticle(body.article);
    }

    @Post('react-agent')
    reactAgent(@Body() body: { message: string, threadId: string }) {
        return this.reactAgentService.run(body.message, body.threadId);
    }

    @Post('routing-agent')
    routingAgent(@Body() body: { message: string }) {
        return this.routingService.run(body.message);
    }

    @Post('parallel-agent')
    parallelAgent(@Body() body: { message: string }) {
        return this.parallelService.run(body.message);
    }
}
