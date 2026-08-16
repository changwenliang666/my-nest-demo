import { tool } from '@langchain/core/tools';
import { ChatOllama } from '@langchain/ollama';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { config } from 'src/config';
import { z } from 'zod';
import { MemorySaver, MessagesAnnotation, StateGraph, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

const getWeatherByCity = tool(
    async ({ city }: { city: string }) => {
        console.log('getWeatherByCity----', city);
        if (!city) return '请提供城市名称';
        const cityWeatherInfo = {
            '北京': '晴天,20度',
            '上海': '多云,22度',
            '广州': '小雨,23度',
            '深圳': '晴天,24度',
            '成都': '阴天,25度',
            '重庆': '小雨,26度',
            '西安': '晴天,27度',
            '武汉': '多云,28度',
            '杭州': '晴天,29度',
        }
        return cityWeatherInfo[city] || '城市不存在';
    },
    {
        name: 'getWeatherByCity',
        description: '获取城市天气信息',
        schema: z.object({
            city: z.string().describe('城市名称'),
        }),
    }
)
// 计算工具
const calculateTool = tool(
    async ({ expression }: { expression: string }) => {
        console.log('calculateTool----', expression);
        try {
            const result = eval(expression);
            return result;
        } catch (error) {
            return '计算错误';
        }
    },
    {
        name: 'calculate',
        description: '计算表达式,例如1+1=2',
        schema: z.object({
            expression: z.string().describe('表达式,例如1+1=2'),
        }),
    }
)


const tools = [getWeatherByCity, calculateTool];

@Injectable()
export class ReactAgentService implements OnModuleInit {
    private llm!: ChatOllama;
    private llmTool!: any;
    private mygraph!: any;


    private callModel = async (state: typeof MessagesAnnotation.State) => {
        console.log('callModel----', state.messages);
        const systemMessage = new SystemMessage(
            `你是一个ai助手，请根据用户的问题，使用工具回答问题
            工具列表:${tools.map(tool => tool.name).join(',')}`
        )
        const response = await this.llmTool.invoke([systemMessage, ...state.messages]);
        return {
            messages: [response],
        }
    }

    private shouldContinue = async (state: typeof MessagesAnnotation.State) => {
        const msg = state.messages.at(-1) as AIMessage;
        if (msg.tool_calls && msg.tool_calls.length > 0) {
            return 'tools'
        } else {
            return END;
        }
    }

    async run(message: string, threadId: string) {
        const response = await this.mygraph.invoke({
            messages: [new HumanMessage(message)],
        }, {
            configurable: {
                thread_id: threadId,
            },
            recursionLimit: 10,
        })

        return {
            answer: response.messages.at(-1)?.content as string,
        }
    }

    onModuleInit() {
        this.llm = new ChatOllama({
            model: config.ollama.qwenModel.chatModel,
            temperature: config.ollama.qwenModel.temperature,
            baseUrl: config.ollama.qwenModel.host,
            think: false,
        })

        this.llmTool = this.llm.bindTools(tools);

        const toolNode = new ToolNode(tools);
        this.mygraph = new StateGraph(MessagesAnnotation).
            addNode('callModel', this.callModel)
            .addNode('tools', toolNode).
            addEdge(START, 'callModel')
            .addConditionalEdges('callModel', this.shouldContinue, {
                tools: 'tools',
                [END]: END,
            }).addEdge('tools', 'callModel').compile({ checkpointer: new MemorySaver() });
    }
}
