import { ChatOllama } from '@langchain/ollama';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { config } from 'src/config';
import { StateGraph, MessagesAnnotation, START, END,MemorySaver } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class LanggraphService implements OnModuleInit {
    private readonly logger = new Logger(LanggraphService.name);
    private llm!: ChatOllama;
    private simpleGraph!: any;

    async simpleChat(message: string, threadId: string) {
        const response = await this.simpleGraph.invoke({
            messages: [new HumanMessage(message)],
        },{
            configurable: { thread_id: threadId } 
        })
        return response.messages.at(-1)?.content;
    }

    private logNodeInput(nodeName: string, messages: BaseMessage[]) {
        this.logger.log(`[${nodeName}] 进入，收到消息数=${messages.length}`);
        messages.forEach((msg, i) => {
            this.logger.log(
                `[${nodeName}] messages[${i}] type=${msg.getType()} content=${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}`,
            );
        });
    }

    private logNodeOutput(nodeName: string, content: unknown) {
        this.logger.log(
            `[${nodeName}] 大模型输出 content=${typeof content === 'string' ? content : JSON.stringify(content)}`,
        );
    }

    private chatNodeA = async (
        state: typeof MessagesAnnotation.State
    ) => {
        this.logNodeInput('chatNodeA', state.messages);
        const systemMessage = new SystemMessage("你是一个可以古诗文ai助手,根据用户输入的一句古诗，给出完整的古诗，包括作者，朝代，诗词完整内容")
        const humanMessage = new HumanMessage(`输入的诗词内容： ${state.messages.at(-1)?.content ?? ''} `);
        const response = await this.llm.invoke([
            systemMessage,
            humanMessage
        ]);
        this.logNodeOutput('chatNodeA', response.content);

        return {
            messages: [response]
        };
    };


    private chatNodeB = async (
        state: typeof MessagesAnnotation.State
    ) => {
        this.logNodeInput('chatNodeB', state.messages);

        // 不要把多段 system + 历史原样塞给模型；取上一节点产出，作为明确任务输入
        const poem = state.messages.at(-1)?.content ?? '';
        const response = await this.llm.invoke([
            new SystemMessage(
                '你是一个古诗文赏析ai助手，根据输入的古诗，给出古诗的赏析，语言简洁明了',
            ),
            new HumanMessage(`请赏析下面这首诗：\n${poem}`),
        ]);
        this.logNodeOutput('chatNodeB', response.content);

        return {
            messages: [response]
        };
    };


    private chatNodeC = async (
        state: typeof MessagesAnnotation.State
    ) => {
        this.logNodeInput('chatNodeC', state.messages);

        const appreciation = state.messages.at(-1)?.content ?? '';
        const response = await this.llm.invoke([
            new SystemMessage(
                '你是一个古诗文赏析点评的ai助手，对于输入的古诗赏析进行点评，返回赏析的优点和缺点',
            ),
            new HumanMessage(`请点评下面这段赏析：\n${appreciation}`),
        ]);
        this.logNodeOutput('chatNodeC', response.content);

        return {
            messages: [response]
        };
    };
    async getHistory(threadId: string) {
        const historyMessages = await this.simpleGraph.getState({
            configurable: { thread_id: threadId } 
        })
        return historyMessages.messages.map(message => message.content).join('\n');
    }

    onModuleInit() {
        this.llm = new ChatOllama({
            model: config.ollama.qwenModel.chatModel,
            temperature: config.ollama.qwenModel.temperature,
            baseUrl: config.ollama.qwenModel.host,
            think: false,
        })
        this.simpleGraph = new StateGraph(MessagesAnnotation)
        .addNode('chatNode', this.chatNodeA)
        .addNode('chatNodeB', this.chatNodeB)
        .addNode('chatNodeC', this.chatNodeC)
        .addEdge(START, 'chatNode')
        .addEdge('chatNode', 'chatNodeB')
        .addEdge('chatNodeB', 'chatNodeC')
        .addEdge('chatNodeC', END)
        .compile({ checkpointer: new MemorySaver() });
    }
}
