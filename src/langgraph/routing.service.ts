import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import {config} from '../config';
import { StateGraph,START,END,Annotation } from '@langchain/langgraph';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const routingAnnotation = Annotation.Root({
    routing: Annotation<string[]>({ // 意图列表
        reducer: (prev, cur) => [...prev, ...cur],
        default: () => [],
    }),
    question: Annotation<string>(),
    answer: Annotation<string>(),
    logs:Annotation<string[]>({
        reducer: (prev, cur) => [...prev, ...cur],
        default: () => [],
    }),
})


@Injectable()
export class RoutingService implements OnModuleInit {
    private llm!: ChatOllama;
    private myGraph!:any;

    private callModel = async(state: typeof routingAnnotation.State) => {
        const routintList = ['technical', 'digital', 'medical', 'other'];
        const systemMessage = new SystemMessage(
            `你是一个可以区分用户意图的ai助手，将用户意图拆分成不同的意图，并直接返回意图的名称，不要有任何解释
            例如：用户输入技术类的问题，则返回technical,
            用户输入数码类的问题，则返回digital,
            用户输入医学类的问题，则返回medical,
            其他类型的问题，则统一返回other
            `
        )
        const response = await this.llm.invoke([systemMessage, new HumanMessage(state.question)]);
        const intent = (response.content as string).trim().toLowerCase();
      
        return {
            routing:[ routintList.includes(intent) ? intent : 'other'],
            logs: ["模型识别意图：" + intent],
        }
    }

    private myHandlerFn = async(state:typeof routingAnnotation.State) => {
        const routing = state.routing;
        let systemMessagePrompt = ''
        switch(routing[0]) {
            case 'technical': 
                systemMessagePrompt = `你是一个技术专家，请根据用户的问题，给出专业的回答`
                break;
            case 'digital':
                systemMessagePrompt = `你是一个数码专家，请根据用户的问题，给出专业的回答`
                break;
            case 'medical':
                systemMessagePrompt = `你是一个医学专家，请根据用户的问题，给出专业的回答`
                break;
            case 'other':
                systemMessagePrompt = `你是一个通用专家，请根据用户的问题，给出专业的回答`
                break;
        }
        const systemMessage = new SystemMessage(systemMessagePrompt);
        const response = await this.llm.invoke([systemMessage, new HumanMessage(state.question)]);
        return {
            answer: response.content as string,

        }

    }

    private routingDecisionFn = async(state:typeof routingAnnotation.State) => {
        const routing = state.routing;
        return routing[0];
    }

    async run(message:string) {
        const response = await this.myGraph.invoke({question: message});
        return {
            question: response.question,
            answer: response.answer,
            logs: response.logs,
        }
    }

    async onModuleInit() {
        this.llm = new ChatOllama({
            model: config.ollama.qwenModel.chatModel,
            temperature: config.ollama.qwenModel.temperature,
            baseUrl: config.ollama.qwenModel.host,
            think: false,
        })

        this.myGraph = new StateGraph(routingAnnotation)
        .addNode('callModel', this.callModel)
        .addNode('technical', this.myHandlerFn)
        .addNode('digital', this.myHandlerFn)
        .addNode('medical', this.myHandlerFn)
        .addNode('other', this.myHandlerFn)
        .addEdge(START, 'callModel')
        .addConditionalEdges('callModel', this.routingDecisionFn,{
            technical: 'technical',
            digital: 'digital',
            medical: 'medical',
            other: 'other',
        })
        .addEdge('technical', END)
        .addEdge('digital', END)
        .addEdge('medical', END)
        .addEdge('other', END)
        .compile();
    }
}
