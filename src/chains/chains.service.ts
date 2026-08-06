import { Injectable } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { config } from '../config';
import { ChatOllama } from '@langchain/ollama';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence,RunnablePassthrough } from '@langchain/core/runnables';
import type { Response } from 'express';

@Injectable()
export class ChainsService {
    private llm = new ChatOllama({
        model:config.ollama.chatModel,
        temperature:config.ollama.temperature,
        baseUrl:config.ollama.host,
        think:false,
    })
    async article(article:string) {
        const analyzePrompt = ChatPromptTemplate.fromMessages([
            ["system",`你是一个文章分析助手，帮助用户分析文章的结构和内容,只返回需要优化的地方，不要返回其他内容`],
            ["user",`请分析以下文章的结构和内容: {article}`],
        ])
        const analyzeChain = analyzePrompt.pipe(this.llm).pipe(new StringOutputParser());

        const polishPrompt = ChatPromptTemplate.fromMessages([
            ["system",`你是一个文章优化助手，根据返回的文章问题，进行优化，改进文章的表达，结构和用词，直接输出优化后的文章，不要返回其他内容`],
            ["user",`请根据下列问题进行优化文章: {analyze},原文内容：{article}`],
        ])

        const poblishChain = RunnableSequence.from([
            {
                article: new RunnablePassthrough(),
                analyze:analyzeChain,
            },
            polishPrompt.pipe(this.llm).pipe(new StringOutputParser()),
        ])
        
        const response = await poblishChain.invoke({article});
        return {
            success:true,
            data:response,
            input:article,
        }
    }
    //文言文生成助手
    async generateArticle(title:string,style:string) {
        //第一步，根据标题和风格，生成文章大纲
       const outlineChain =  ChatPromptTemplate.fromMessages([
            ["system",`你是一个文章生成助手，根据用户输入的标题和风格，生成文章大纲，直接输出大纲，不要返回其他内容`],
            ["user",`请根据下列标题和风格生成文章大纲: {title},风格: {style}`],
        ]).pipe(this.llm).pipe(new StringOutputParser());

        const outlineResponse = await outlineChain.invoke({title,style});

        //第二步，根据大纲，生成文章
        const articleChain = ChatPromptTemplate.fromMessages([
            ["system",`你是一个文章生成助手，根据用户输入的大纲，生成文章，直接输出文章，不要返回其他内容`],
            ["user",`请根据下列大纲生成文章: {outline}`],
        ]).pipe(this.llm).pipe(new StringOutputParser());

        const articleResponse = await articleChain.invoke({outline:outlineResponse});

        // 第三步，将生成好的白话文，转换为文言文
        const translateChain = ChatPromptTemplate.fromMessages([
            ["system",`你是一个文言文转换助手，将用户输入的白话文转换为文言文，直接输出文言文，不要返回其他内容`],
            ["user",`请将下列白话文转换为文言文: {article}`],
        ]).pipe(this.llm).pipe(new StringOutputParser());

        const translateResponse = await translateChain.invoke({article:articleResponse});

        return {
            success:true,
            data:translateResponse,
            input:{
                title,
                style,
                outline:outlineResponse,
                article:articleResponse,
            },
        }
    }
    // 诗词补全助手，并给出赏析
    async translateWenYanToBaiHua(sentences:string,res:Response) {
        res.setHeader('Content-Type','text/event-stream')
        res.setHeader('Cache-Control','no-cache')
        res.setHeader('Connection','keep-alive')
        res.setHeader('Access-Control-Allow-Origin','*')
        res.write(`data:AI助手正在分析...\n\n`)
        const outlineChain = ChatPromptTemplate.fromMessages([
            ['system',"你是一个古诗词助手，根据用户输入的某一句诗词，查询到完整诗词，仅输出原文全部内容，不要返回其他内容"],
            ['user',"请根据输入的某一句诗词，查找出完整诗词: {sentences}"],
        ]).pipe(this.llm).pipe(new StringOutputParser());
        
        const outlineResponse = await outlineChain.invoke({sentences});
        const markChain = ChatPromptTemplate.fromMessages([
            ['system',"你是一个古文赏析助手，根据用户输入的诗词文章，进行赏析，要返回作者，作者所处的朝代，创作背景，以及翻译"],
            ["user",'古诗词原文:{article}']
        ]).pipe(this.llm);
        const markResponse = await markChain.stream({article:outlineResponse});
        for await ( const chunk of markResponse ) {
            res.write(`data: ${chunk.content}\n\n`)
        }
        res.write('data: [DONE]\n\n')
        res.end()
    }
}
