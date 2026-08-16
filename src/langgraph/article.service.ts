import { Injectable, OnModuleInit } from "@nestjs/common";
import { ChatOllama } from '@langchain/ollama';
import { config } from "src/config";
import { Annotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { StateGraph, START, END } from "@langchain/langgraph";

//自定义文章摘要数据结构
const articleAnnotation = Annotation.Root({
    article: Annotation<string>(),
    keywords: Annotation<string[]>({
        reducer: (prev, cur) => [...prev, ...cur],
        default: () => [],
    }),
    summary: Annotation<string>(),
    logs: Annotation<string[]>({
        reducer: (prev, cur) => [...prev, ...cur],
        default: () => [],
    })
})

@Injectable()
export class ArticleService implements OnModuleInit {

    private llm!: ChatOllama;
    private articleGraph!: any;



    async generateArticle(article: string) {
        const response = await this.articleGraph.invoke({
            article
        });
        return {
            article: response.article,
            keywords: response.keywords,
            summary: response.summary,
            logs: response.logs,
        }
    }

    onModuleInit() {
        this.llm = new ChatOllama({
            model: config.ollama.qwenModel.chatModel,
            temperature: config.ollama.qwenModel.temperature,
            baseUrl: config.ollama.qwenModel.host,
            think: false,
        })

        //关键词提取节点
        const getKeywordsNode = async (state: typeof articleAnnotation.State) => {
            const nowTime = new Date().getTime();
            const article = state.article;
            const systemMessage = new SystemMessage('你是一个关键词生成ai助手，根据输入的文章，给出文章的关键词,只给出关键词，不要给出任何其他内容');
            const keywords = await this.llm.invoke([
                systemMessage,
                new HumanMessage(`用户输入的文章：${article}`),
            ]);
            const endTime = new Date().getTime();
            return {
                keywords: [keywords.content],
                logs: [`关键词生成完成，耗时：${(endTime - nowTime) / 1000}s`],
            }
        }

        //生成摘要节点
        const generateSummaryNode = async (state: typeof articleAnnotation.State) => {
            const nowTime = new Date().getTime();
            const article = state.article;
            const keywords = state.keywords;
            const systemMessage = new SystemMessage('你是一个摘要生成ai助手，根据输入的文章的原文和关键词,只给出摘要，不要给出任何其他内容');
            const summary = await this.llm.invoke([
                systemMessage,
                new HumanMessage(`用户输入的文章：${article}，关键词：${keywords}`),
            ]);
            const endTime = new Date().getTime();
            return {
                summary: summary.content,
                logs: [`摘要生成完成，耗时：${(endTime - nowTime) / 1000}s`],
            }
        }

        this.articleGraph = new StateGraph(articleAnnotation)
            .addNode('getKeywordsNode', getKeywordsNode)
            .addNode('generateSummaryNode', generateSummaryNode)
            .addEdge(START, 'getKeywordsNode')
            .addEdge('getKeywordsNode', 'generateSummaryNode')
            .addEdge('generateSummaryNode', END).compile();

        console.log('模块初始化完成');
    }
}