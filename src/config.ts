export const config = {
    ollama:{
        host:"http://localhost:11434",
        chatModel:"qwen3.5:4b",
        embedModel:"mxbai-embed-large:latest",
        temperature:0.3,
    },
    openweathermap:{
        apiKey:"5bab0edf29622d931a43bd2955d407f4",
        baseUrl:"https://api.openweathermap.org/data/4.0/onecall/current",
    }
}
