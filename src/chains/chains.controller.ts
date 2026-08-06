import { Controller,Post,Body,Res } from '@nestjs/common';
import { ChainsService } from './chains.service';
import type { Response } from 'express';
@Controller('chains')
export class ChainsController {
    constructor(private readonly chainsService:ChainsService){}
    @Post('article')
    article(@Body() body:{article:string}) {
        return this.chainsService.article(body.article);
    }
    @Post('generateArticle')
    generateArticle(@Body() body:{title:string,style:string}) {
        return this.chainsService.generateArticle(body.title,body.style);
    }
    @Post('gushici')
    translateWenYanToBaiHua(@Body() body:{sentences:string},@Res() res:Response) {
        return this.chainsService.translateWenYanToBaiHua(body.sentences,res);
    }

}
