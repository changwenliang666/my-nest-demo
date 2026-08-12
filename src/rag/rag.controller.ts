import { Controller, Post, Body } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
    constructor(private readonly ragService: RagService) {}

    @Post('load')
    loadDocuments (@Body() body:{documents:{id:string,content:string,source?:string}[]})    {
        return this.ragService.loadDocuments(body.documents);
    }
    // 向量库查询
    @Post('search')
    search(@Body() body:{query:string,topK:number})    {
        return this.ragService.search(body.query,body.topK);
    }
    // 知识库问答
    @Post('query')
    query(@Body() body:{question:string,topK:number})    {
        return this.ragService.query(body.question,body.topK);
    }
}
