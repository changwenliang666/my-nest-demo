import { Controller, Post, Body, Res } from '@nestjs/common';
import { ModelService } from './models.service';
import type { Response } from 'express';


@Controller('model')
export class ModelController {
    constructor(private readonly modelService:ModelService){}

    @Post('chat')
    baseChat(@Body() body:{message:string}) {
        return this.modelService.baseChat(body.message)
    }

    @Post('chat-system')
    chatSystem(@Body() body:{message:string,system:string}) {
        return this.modelService.chatSystem(body.message,body.system)
    }

    @Post('chat-stream')
    chatStream(@Body() body:{message:string,system:string},@Res() res:Response) {
        return this.modelService.chatStream(body.message,body.system,res)
    }

    @Post('chat-parse')
    chatParse(@Body() body:{message:string,system:string}) {
        return this.modelService.chatParse(body.message,body.system)
    }
}
