import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article_dto';

@Injectable()
export class ArticleService {
    constructor(private readonly prisma: PrismaService) {}
    async createArticle(createArticleDto: CreateArticleDto) {
        let article;
        try {
            article = await this.prisma.article.create({
                data: {
                    title: createArticleDto.title,
                    content: createArticleDto.content,
                    authorId: createArticleDto.authorId, 
                },
            })
        } catch (error) {
            return {
                code: 1,
                msg: "error",
                data: "插入数据失败",
            }
        }
 
        return {
            code: 0,
            msg: "success",
            data: article,
        }
    }
    async getArticleInfo(articleId: number) {
        const articleInfo = await this.prisma.article.findUnique({
            where:{
                id: articleId,
            },
            select:{
                title: true,
                content: true,
                user:{
                    select:{
                        name: true,
                        email: true,
                    },
                },
            },
      
        })
        return {
            code: 0,
            msg: "success",
            data: articleInfo,
        }
    }
    async updateArticle(updateArticleDto: UpdateArticleDto) {
        let article;
        try {
            article = await this.prisma.article.update({
                where:{
                    id: updateArticleDto.articleId,
                },
                data: {
                    title: updateArticleDto.title,
                    content: updateArticleDto.content,
                },
                select:{
                    title: true,
                    content: true,
                },
            })
        } catch (error) {
            return {
                code: 1,
                msg: "error",
                data: "更新数据失败",
            }
        }
        return {
            code: 0,
            msg: "success",
            data: article,
        }
    }
    async deleteArticle(articleId: number) {
        try {
            await this.prisma.article.delete({
                where:{
                    id: articleId,
                },
                select:{
                    title: true,
                    content: true,
                },
            })
        }
        catch (error) {
            return {
                code: 1,
                msg: "error",
                data: "删除数据失败",
            }
        }
        return {
            code: 0,
            msg: "success",
            data: "删除数据成功",
        }
    }
    async getArticleList(authorId: number, pageNum: number, pageSize: number) {
        const skip = (pageNum - 1) * pageSize;
        const where = { authorId: authorId };
        const [list, total] = await this.prisma.$transaction([
            this.prisma.article.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    id: 'desc',
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            id: true,
                        },
                    },
                },
            }),
            this.prisma.article.count({ where }),
        ]);

        return {
            code: 0,
            msg: 'success',
            data: {
                list,
                total,
                pageNum,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
}
