import { Controller } from '@nestjs/common';
import { ArticleService } from './article.service';
import { Post, Body, Get, Query, Delete } from '@nestjs/common';
import { CreateArticleDto, UpdateArticleDto } from './dto/article_dto';
import { ParseIntPipe } from '@nestjs/common';

@Controller('article')
export class ArticleController {
    constructor(private readonly articleService: ArticleService) {}
    @Post('createArticle')
    createArticle(@Body() createArticleDto: CreateArticleDto) {
        return this.articleService.createArticle(createArticleDto);
    }
    @Get('getArticleInfo')
    getArticleInfo(@Query('articleId', ParseIntPipe) articleId: number) {
        return this.articleService.getArticleInfo(articleId);
    }

    @Post('updateArticle')
    updateArticle(@Body() updateArticleDto: UpdateArticleDto) {
        return this.articleService.updateArticle(updateArticleDto);
    }
    @Delete('deleteArticle')
    deleteArticle(@Query('articleId', ParseIntPipe) articleId: number) {
        return this.articleService.deleteArticle(articleId);
    }
    @Get('getArticleList')
    getArticleList(
        @Query('userId', ParseIntPipe) userId: number,
        @Query('pageNum', ParseIntPipe) pageNum: number,
        @Query('pageSize', ParseIntPipe) pageSize: number,
    ) {
        return this.articleService.getArticleList(userId, pageNum, pageSize);
    }
}
