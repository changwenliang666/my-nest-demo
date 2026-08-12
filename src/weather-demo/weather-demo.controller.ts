import { Controller, Post, Body } from '@nestjs/common';
import { WeatherDemoService } from './weather-demo.service';

@Controller('weather-demo')
export class WeatherDemoController {
    constructor(private readonly weatherDemoService: WeatherDemoService) {}
    @Post('chat')
    chat(@Body() body: { message: string, sessionId: string }) {
        return this.weatherDemoService.chat(body.message, body.sessionId);
    }
}
