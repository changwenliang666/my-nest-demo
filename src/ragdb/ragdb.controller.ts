import { Controller, Post, Body, Get } from '@nestjs/common';
import { RagdbService } from './ragdb.service';

@Controller('ragdb')
export class RagdbController {
    constructor(private readonly ragdbService: RagdbService) {}

    @Post('load')
    loadDocuments (@Body() body:{documents:{id:string,content:string,source?:string}[]})    {
        return this.ragdbService.loadDocuments(body.documents);
    }
    @Get('getDocuments')
    getDocuments()    {
        return this.ragdbService.getDocuments();
    }
    // 向量库查询
    @Post('search')
    search(@Body() body:{query:string,topK:number})    {
        return this.ragdbService.search(body.query,body.topK);
    }
    // 知识库问答
    @Post('query')
    query(@Body() body:{question:string,topK:number})    {
        return this.ragdbService.query(body.question,body.topK);
    }
}
