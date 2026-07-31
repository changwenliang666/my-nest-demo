export class CreateArticleDto {
    title!: string;
    content!: string;
    authorId!: number;
}
export class UpdateArticleDto {
    articleId!: number;
    title?: string;
    content?: string;
}

export class QueryArticleListDto {
    userId!: number;
    pageNum!: number;
    pageSize!: number;
}