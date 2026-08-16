import { ChatOllama } from '@langchain/ollama';
import { Injectable } from '@nestjs/common';
import { config } from 'src/config';
import { BaseMessage, SystemMessage, HumanMessage, ToolMessage, AIMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

@Injectable()
export class WeatherDemoService {
    private llm = new ChatOllama({
        model: config.ollama.qwenModel.chatModel,
        temperature: config.ollama.qwenModel.temperature,
        baseUrl: config.ollama.qwenModel.host,
        think: false,
    })

    private historyMessage = new Map<string, BaseMessage[]>();

    private formatDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    private buildSystemMessage(): SystemMessage {
        const today = this.formatDate(new Date());
        return new SystemMessage(
            `你是一个个人助理，根据上下文回答用户问题，不要偏离主题。` +
            `今天是 ${today}（本地日期）。` +
            `你可以调用工具 getWeather 查询天气。` +
            `用户说明天/后天等相对时间时，先换算成 YYYY-MM-DD 再调用 getWeather。` +
            `只能查询今天起共3天（含今天）的天气，超出范围请直接告知用户。`,
        );
    }

    private getOrCreateHistoryMessage(sessionId: string): BaseMessage[] {
        if (!this.historyMessage.has(sessionId)) {
            this.historyMessage.set(sessionId, [this.buildSystemMessage()]);
        } else {
            // 每次对话刷新「今天」，避免跨天会话日期过期
            const messages = this.historyMessage.get(sessionId)!;
            messages[0] = this.buildSystemMessage();
        }
        return this.historyMessage.get(sessionId)!;
    }

    // 天气工具：模型只传人话日期，时间戳与范围校验在代码里完成
    private getWeather = tool(
        async ({ city, date }: { city: string; date: string }) => {
            if (!city) return '请提供城市名称';
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return '日期格式错误，请使用 YYYY-MM-DD，例如 2026-08-09';
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(`${date}T00:00:00`);
            if (Number.isNaN(target.getTime())) {
                return `无法解析日期：${date}`;
            }

            const diffDays = Math.round(
                (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
            );
            if (diffDays < 0) return `无法查询过去天气（${date}）`;
            if (diffDays > 2) {
                return `只能查询今天起未来3天（含今天）的天气，${date} 超出范围`;
            }

            // 免费版用 5 天/3 小时预报；forecast/daily 需付费订阅
            let data: any;
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${config.openweathermap.apiKey}&lang=zh_cn&units=metric`,
                );
                data = await response.json();
            } catch (err) {
                return `天气 API 请求失败（网络超时或无法访问 openweathermap.org）：${err instanceof Error ? err.message : String(err)}`;
            }
            if (!data.list?.length) {
                return `查询失败：${data.message || JSON.stringify(data)}`;
            }

            const dayItems = data.list.filter((item: { dt_txt?: string; dt: number }) => {
                const itemDate = item.dt_txt
                    ? item.dt_txt.slice(0, 10)
                    : this.formatDate(new Date(item.dt * 1000));
                return itemDate === date;
            });
            const closest =
                dayItems.find((item: { dt_txt?: string }) => item.dt_txt?.includes('12:00:00')) ??
                dayItems[0] ??
                data.list[data.list.length - 1];

            const description = closest.weather?.[0]?.description ?? '未知';
            const temp = closest.main?.temp ?? '未知';
            const humidity = closest.main?.humidity ?? '未知';

            return `${city} ${date} 天气：${description}，温度：${temp}℃，湿度：${humidity}%`;
        },
        {
            name: 'getWeather',
            description: '查询指定城市某一天的天气，只能查今天起共3天',
            schema: z.object({
                city: z.string().describe('城市名称，如 北京、Shanghai'),
                date: z.string().describe('查询日期，格式 YYYY-MM-DD，例如 2026-08-09'),
            }),
        },
    );

    async chat(message: string, sessionId: string) {
        const tools = [this.getWeather];
        const toolsMap = {
            getWeather: this.getWeather,
        };
        const step: string[] = [];

        const messages = this.getOrCreateHistoryMessage(sessionId);
        messages.push(new HumanMessage(message));

        const llmWithTools = this.llm.bindTools(tools);

        for (let i = 0; i < 5; i++) {
            const response = await llmWithTools.invoke(messages);
            messages.push(response);
            step.push(`[模型输出] content=${JSON.stringify(response.content)} tool_calls=${JSON.stringify(response.tool_calls ?? [])}`);

            if (!response.tool_calls || response.tool_calls.length === 0) {
                step.push(`[最终回答]-${response.content}`);
                break;
            }

            for (const toolCall of response.tool_calls) {
                const toolFn = toolsMap[toolCall.name];
                if (!toolFn) {
                    step.push(`工具不存在-${toolCall.name}`);
                    continue;
                }
                step.push(`调用工具：${toolCall.name}，输入参数：${JSON.stringify(toolCall.args)}`);
                try {
                    const toolResult = await toolFn.invoke(toolCall.args);
                    step.push(`工具结果：${toolResult}`);
                    messages.push(
                        new ToolMessage({
                            content: String(toolResult),
                            tool_call_id: toolCall.id as string,
                        }),
                    );
                } catch (err) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    step.push(`工具执行异常：${errMsg}`);
                    messages.push(
                        new ToolMessage({
                            content: `工具执行失败：${errMsg}`,
                            tool_call_id: toolCall.id as string,
                        }),
                    );
                }
            }
        }

        const lastAiMessage = [...messages].reverse().find((msg) => msg instanceof AIMessage);
        const finalAnswer = lastAiMessage?.content || '回答失败';
        return {
            answer: finalAnswer,
            step,
            question: message,
        };
    }
}
