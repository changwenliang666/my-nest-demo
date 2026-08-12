import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LanggraphService } from './langgraph.service';
import { ArticleService } from './article.service';

@Controller('langgraph')
export class LanggraphController {
    constructor(private readonly langgraphService: LanggraphService, private readonly articleService: ArticleService) {}
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
}
