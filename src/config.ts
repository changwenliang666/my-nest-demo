export const config = {
    ollama: {
        host: "http://localhost:11434",
        chatModel: "qwen3.5:4b",
        embedModel: "mxbai-embed-large:latest",
        temperature: 0.3,
    },
    openweathermap: {
        apiKey: "5bab0edf29622d931a43bd2955d407f4",
        baseUrl: "https://api.openweathermap.org/data/4.0/onecall/current",
    },
    langGraph: {
        model: process.env.LANGGRAPH_MODEL || 'qwen3.5:4b',
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
        apiKey: 'ollama',    // Ollama 不校验 apiKey，随便填个占位符即可
        temperature: 0.7,
    },
}
