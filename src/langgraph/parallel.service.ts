import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { config } from 'src/config';
import { StateGraph, START, END, Annotation, Command, Send } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const parallelAnnotation = Annotation.Root({
    question: Annotation<string>(),
    answer: Annotation<string>(),
    results: Annotation<{ taskName: string, result: string }[]>(
        {
            reducer: (prev, cur) => [...prev, ...cur],
            default: () => [],
        }
    )
})
const subTaskAnnotation = Annotation.Root({
    taskName: Annotation<string>()
})

@Injectable()
export class ParallelService implements OnModuleInit {
    private llm!: ChatOllama;
    private mygraph!: any;
    // 任务拆分节点
    private splitTaskNode = async (state: typeof parallelAnnotation.State) => {
        const userQuestion = state.question;
        const systemMessage = new SystemMessage(
            `你是一个ai助手，需要根据用户问题，对用户问题进行任务拆分，拆分后直接返回任务列表，不需要返回其他的任何内容：
            例如：
            用户问题："我想了解朱元璋，然后帮我查一下vue3是什么技术"；输出任务列表：["查询中国历史人物朱元璋", "查询前端技术vue3"]
            用户问题："我想了解harness是什么东西"；输出任务列表：["查询harness是什么东西"]
            用户问题："我想了解langgraph是什么，和langchain有什么关系"；输出任务列表：["langgraph是什么","langchain和langgraph有什么关系"]
            `
        )
        const response = await this.llm.invoke([systemMessage, new HumanMessage(userQuestion)])
        const taskList = JSON.parse(response.content as string); // 将返回的任务列表转换为JSON对象
        console.log("拆分任务列表：", taskList);
        if (taskList.length === 0 || taskList.length > 3) { // 如果任务列表为空或超过3个，则直接返回结束
            return new Command({
                goto: END,
                update: {
                    results: [{ taskName: "", result: "" }],
                    answer: "用户意图太多，请减少意图，最多可以处理三个意图"
                }
            });
        } else {
            return new Command({
                goto: taskList.map(task => new Send("processTaskNode", { taskName: task }))
            });
        }
    }
    // 子任务处理节点
    private processTaskNode = async (state: typeof subTaskAnnotation.State) => {
        console.log("处理任务节点：", state.taskName);
        const taskName = state.taskName;
        const systemMessage = new SystemMessage(
            `你是一个ai助手,帮助用户解决问题,用简介的语言回复用的问题，不要太啰嗦`
        )
        const userMessage = new HumanMessage(taskName);
        const response = await this.llm.invoke([systemMessage, userMessage]);
        return {
            results: [{ taskName: taskName, result: response.content as string }]
        }
    }
    // 合并子任务结果节点
    private mergeTaskResultsNode = async (state: typeof parallelAnnotation.State) => {
        console.log("合并子任务结果节点：", state.results);
        const results = state.results;
        const systemMessage = new SystemMessage(
            `你是一个ai总结信息的助手，根据用户输入的信息进行总结，要求：总结信息要根据用户提供的信息，不要随意编撰，也不能随意丢弃信息，保证得到的结果涵盖了用户提供的所有信息`
        )
        const aiModelMessage = results.map(task => task.result).join("\n\n");
        console.log("ai模型消息：", aiModelMessage);
        const userMessage = new HumanMessage(aiModelMessage);
        const response = await this.llm.invoke([systemMessage, userMessage]);
        return {
            answer: response.content as string
        }
    }
    async run(message: string) {
        const result = await this.mygraph.invoke({ question: message });
        return {
            question: message,
            answer: result.answer,
            results: result.results
        }

    }
    onModuleInit() {
        this.llm = new ChatOllama({
            model: config.ollama.qwenModel.chatModel,
            temperature: config.ollama.qwenModel.temperature,
            baseUrl: config.ollama.qwenModel.host,
            think: false,
        })


        this.mygraph = new StateGraph(parallelAnnotation)
            .addNode("splitTaskNode", this.splitTaskNode, {
                ends: ['processTaskNode', END]
            })
            .addNode("processTaskNode", this.processTaskNode)
            .addNode("mergeTaskResultsNode", this.mergeTaskResultsNode)
            .addEdge(START, "splitTaskNode")
            .addEdge("processTaskNode", "mergeTaskResultsNode")
            .addEdge("mergeTaskResultsNode", END)
            .compile();
    }
}
