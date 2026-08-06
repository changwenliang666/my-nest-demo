import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { config } from '../config';
import { ChatPromptTemplate, FewShotPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

@Injectable()
export class PromptsService {
    private llm = new ChatOllama({
        model:config.ollama.chatModel,
        temperature:config.ollama.temperature,
        baseUrl:config.ollama.host,
        think:false,
    })
    async translate(text:string,targetLanguage:string) {
       const prompt = ChatPromptTemplate.fromMessages([
        ["system",`你是一个翻译助手，只输出翻译结果，帮助用户将输入的文本翻译成指定的语言`],
        ["user","请将以下文本翻译成{targetLanguage}:{text}"],
       ])
       const chain = prompt.pipe(this.llm).pipe(new StringOutputParser())
       const response = await chain.invoke({text,targetLanguage})
       return { 
        answer:response,
        input:text,
        targetLanguage:targetLanguage,
       }
    }
    async summarize(text:string,maxWords:number) {
        const prompt = ChatPromptTemplate.fromTemplate("请把以下文本总结成最多不超过{maxWords}字的摘要: {text}")
        const chain = prompt.pipe(this.llm).pipe(new StringOutputParser())
        const response = await chain.invoke({text,maxWords})
        return {
            answer:response,
            input:text,
            maxWords:maxWords,
        }
    }
    async classify(text:string) {
        const prompt = PromptTemplate.fromTemplate("输入：{text},输出：{label}\n")
        const examples = [
            {
                text:"今天天气不错",
                label:"积极",
            },
            {
                text:"今天天气不好",
                label:"消极",
            },
            {
                text:"今天天气一般",
                label:"中性",
            },
        ]
        const fewShotPrompt =  new FewShotPromptTemplate({
            examples,
            examplePrompt:prompt,
            prefix:"请根据输入的文字进行情感分类，输出积极、消极或中性：",
            suffix:"输入：{text},输出：\n",
            inputVariables:['text'],
        })
        const formatPrompt = await fewShotPrompt.format({text:text})
        console.log(formatPrompt)
        const response = await this.llm.invoke(formatPrompt)
        return {
            answer:response.content,
            input:text,
        }
    }
     
}
