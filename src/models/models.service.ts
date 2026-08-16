import { Injectable } from '@nestjs/common';
import { config } from '../config'
import {ChatOllama} from "@langchain/ollama"
import {HumanMessage,SystemMessage} from "@langchain/core/messages"
import type { Response } from 'express';
import { StringOutputParser } from '@langchain/core/output_parsers';

@Injectable()
export class ModelService {
    private llm = new ChatOllama({
        model:config.ollama.qwenModel.chatModel,
        temperature:config.ollama.qwenModel.temperature,
        baseUrl:config.ollama.qwenModel.host,
        think:false,
    })

    async baseChat(message:string) {
        console.log(message)
        const response = await this.llm.invoke([
          new HumanMessage(message)
        ])
        return {
            success:true,
            data:response.content,
            input:message,
            usage:response.usage_metadata,
        }
    }
    async chatSystem(message:string,system:string) {
        console.log(message,system)
        const response = await this.llm.invoke([
            new HumanMessage(message),
            new SystemMessage(system),
        ])
        return {
            success:true,
            data:response.content,
            input:message,
            usage:response.usage_metadata,
        }
    }
    async chatStream(message:string,system:string,res:Response) {
        res.setHeader('Content-Type','text/event-stream')
        res.setHeader('Cache-Control','no-cache')
        res.setHeader('Connection','keep-alive')
        res.setHeader('Access-Control-Allow-Origin','*')
        const response = await this.llm.stream([
            new HumanMessage(message),
            new SystemMessage(system),
        ])
        for await ( const chunk of response ) {
            res.write(`data: ${chunk.content}\n\n`)
        }
        res.write('data: [DONE]\n\n')
        res.end()
    }

    async chatParse(message:string,system:string) {
        const chain = this.llm.pipe(new StringOutputParser())
        const response = await chain.invoke([
            new HumanMessage(message),
            new SystemMessage(system),
        ])
        return {
            success:true,
            data:response,
        }
    }

}
