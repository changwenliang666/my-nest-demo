import { Injectable } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from 'src/config'
import { ChatOllama } from '@langchain/ollama';

@Injectable()
export class MemoryService {
    private llm = new ChatOllama({
        model:config.ollama.qwenModel.chatModel,
        temperature:config.ollama.qwenModel.temperature,
        baseUrl:config.ollama.qwenModel.host,
        think:false,
    })
    private sessionMap = new Map<string,BaseMessage[]>();
    private sysSystem  = new SystemMessage("你是一个可以记住上下文的ai助手,要根据上下文来回答用户的问题")

    private getOrCreateSessionRecord(sessionId:string):BaseMessage[] {
        if(!this.sessionMap.has(sessionId)) {
            this.sessionMap.set(sessionId,[this.sysSystem])
        }
        return this.sessionMap.get(sessionId) as BaseMessage[];
    }

    async chat(message:string,sessionId:string) {
        const historyMessage:BaseMessage[] = this.getOrCreateSessionRecord(sessionId);
        // 将用户对话加入到历史对话中
        historyMessage.push(new HumanMessage(message));
        const response = await this.llm.invoke(historyMessage);
        historyMessage.push(new AIMessage(response.content));

        return {
            answer:response.content,
            userInput:message,
        }

    }
}
