import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { config } from 'src/config';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { DistanceStrategy, PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Pool } from 'pg';

@Injectable()
export class RagdbService implements OnModuleInit, OnModuleDestroy {
    private llm!: ChatOllama;
    private embeddings!: OllamaEmbeddings;
    private vectorStore!: PGVectorStore;
    private pgPool!: Pool;
    private docCount = 0;
    // 初始化大模型，向量模型，数据库连接
    async onModuleInit() {
        this.llm = new ChatOllama({
            model: config.ollama.chatModel,
            temperature: config.ollama.temperature,
            baseUrl: config.ollama.host,
            think: false,
        });

        this.embeddings = new OllamaEmbeddings({
            model: config.ollama.embedModel,
            baseUrl: config.ollama.host,
        });

        this.pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            // 让每条连接启动即为英文错误信息，兼容 LangChain 的 "already exists" 判断
            options: '-c lc_messages=C',
        });

        this.vectorStore = await PGVectorStore.initialize(this.embeddings, {
            pool: this.pgPool,
            collectionName: 'rag-knowledge-base',
            collectionTableName: 'langchain_pg_collection',
            tableName: 'langchain_pg_embedding',
            columns: {
                idColumnName: 'id',
                vectorColumnName: 'embedding',
                contentColumnName: 'content',
                metadataColumnName: 'metadata',
            },
            distanceStrategy: 'cosine' as DistanceStrategy,
        });
    }

    async onModuleDestroy() {
        await this.pgPool?.end();
    }

    async loadDocuments(documents: { id: string; content: string; source?: string }[]) {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 50,
            separators: ['\n\n', '\n', '。', '！', '？', ' ', ''],
        });

        const allDocs: Document[] = [];

        for (const doc of documents) {
            const chunks = await splitter.createDocuments([doc.content], [{ id: doc.id, source: doc.source }]);
            allDocs.push(...chunks);
        }

        await this.vectorStore.addDocuments(allDocs);
        this.docCount += documents.length;

        return {
            success: true,
            originalDocs: this.docCount,
            totalChunks: allDocs.length,
            message: `加载 ${documents.length} 篇文档，共 ${allDocs.length} 个块（PostgreSQL/pgvector）`,
        };
    }

    async getDocuments() {
        const result = await this.pgPool.query('SELECT * FROM langchain_pg_embedding');
        return {
            success: true,
            documents: result.rows,
        };
    }

    async search(query: string, topK: number) {
        const results = await this.vectorStore.similaritySearchWithScore(query, topK);
        return {
            query,
            results: results.map(([doc, score]) => ({
                content: doc.pageContent,
                source: doc.metadata.source,
                score: parseFloat(score.toFixed(4)),
            })),
        };
    }

    async query(question: string, topK = 3) {
        const retrieved = await this.vectorStore.similaritySearchWithScore(question, topK);
        if (!retrieved.length) return { question, answer: '知识库中没有找到相关内容', sources: [] };

        const context = retrieved.map(([doc], i) => `[${i + 1}] ${doc.pageContent}`).join('\n\n');

        const prompt = ChatPromptTemplate.fromMessages([
            [
                'system',
                `你是知识库问答助手，严格基于参考资料回答。
                规则：
                1. 只根据参考资料内容回答，不能使用资料外的知识
                2. 资料中没有相关信息，回答"知识库中暂无相关内容"
                3. 回答简洁准确，使用中文;
                4. 参考资料中,可能有相关联的信息，可以适当引用，需要理解清楚逻辑关系与顺序，按照时间顺序理解问题会更容易，做好总结，不要主观臆断；
                参考资料：
                {context}`,
            ],
            ['human', '{question}'],
        ]);

        const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
        const answer = await chain.invoke({ context, question });

        return {
            question,
            answer,
            sources: retrieved.map(([doc, score]) => ({
                content: doc.pageContent,
                source: doc.metadata.source,
                score: 1 - parseFloat(score.toFixed(4)),
            })),
        };
    }
}
