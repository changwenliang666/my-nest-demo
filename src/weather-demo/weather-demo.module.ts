import { Module } from '@nestjs/common';
import { WeatherDemoService } from './weather-demo.service';
import { WeatherDemoController } from './weather-demo.controller';

@Module({
  providers: [WeatherDemoService],
  controllers: [WeatherDemoController]
})
export class WeatherDemoModule {}
