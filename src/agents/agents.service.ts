import { ChatOllama } from '@langchain/ollama';
import { Injectable } from '@nestjs/common';
import { config } from 'src/config';
import {tool} from '@langchain/core/tools'
import { z } from 'zod'
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';

@Injectable()
export class AgentsService {
    private llm = new ChatOllama({
        model:config.ollama.chatModel,
        temperature:config.ollama.temperature,
        baseUrl:config.ollama.host,
        think:false,
    })

    private getWeather = tool(
        async ({city}:{city:string}) =>{
            if(!city) {
                return "需要提供城市信息"
            }

            if(city == '北京') {
                return "北京市:最高气温35℃,天气晴"
            }else if(city == '上海') {
                return "上海市:最高气温35℃,天气暴雨红色预警"
            }else {
                return "当前城市天气未知"
            }
        },
        {
            name:"getWeather",
            description:"用来获取当前城市天气的工具函数",
            schema: z.object({
                city:z.string().describe("想要查询天气的城市")
            })
        }
    )


    async runAgents(message:string) {
        const tools = [this.getWeather];
        const toolsMap = {
            'getWeather':this.getWeather,
        }
        const llmWithTools =  this.llm.bindTools(tools);
        const historyMessage: (HumanMessage | AIMessage | ToolMessage | SystemMessage)[] = [
            new SystemMessage("你是一个天气助手，根据用户输入的城市名称，返回具体的天气情况,你有工具函数 getWeather可以使用"),
            new HumanMessage(message),
        ];
        const step :string[] = [];

        for(let i = 0;i<5;i++) {
            const response = await llmWithTools.invoke(historyMessage);
            historyMessage.push(response);

            if(!response.tool_calls || response.tool_calls.length === 0) {
                step.push(`[最终回答]-${response.content}`);
                break;
            }

            for(const toolCall of response.tool_calls) {
                const toolFn = toolsMap[toolCall.name];
                if(!toolFn) {
                    step.push(`工具不存在-${toolCall.name}`)
                    continue;
                }

                step.push(`调用工具：${toolCall.name}，输入参数：${JSON.stringify(toolCall.args)}`)

                const toolResult = await toolFn.invoke(toolCall.args)

                step.push(`工具结果：${toolResult}`)

                historyMessage.push(
                    new HumanMessage({
                        content:String(toolResult),
                        id:toolCall.id,
                    })
                )
            }

        }

        const lastAiMessage = [...historyMessage].reverse().find(message => message instanceof AIMessage);
        const finalAnswer = lastAiMessage?.content || "未知答案"
        return {
            answer:finalAnswer,
            step,
            question:message
        }

    }
}
