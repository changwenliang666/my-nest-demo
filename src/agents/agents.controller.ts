import { Controller,Post,Body } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { config } from 'src/config';
import { Ollama } from '@langchain/ollama';
Ollama

@Controller('agents')
export class AgentsController {
    constructor(private readonly agentsService:AgentsService){}

    @Post("runAgents")
    runAgents(@Body() body : {message:string}) {
        return this.agentsService.runAgents(body.message);
    }
}
