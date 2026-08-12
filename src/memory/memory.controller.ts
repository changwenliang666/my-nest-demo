import { Controller,Body,Post } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { BaseMessage, SystemMessage } from '@langchain/core/messages';

@Controller('memory')
export class MemoryController {
    constructor(private readonly memorySevice:MemoryService){};

    @Post("chat")
    chat(@Body() body: {message:string,sessionId:string}){
        return this.memorySevice.chat(body.message,body.sessionId);
    }
}
