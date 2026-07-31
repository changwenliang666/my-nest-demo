import { Body, Controller, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('test')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("hello")
  getHello(@Query('age') age: number): string {
    return this.appService.getHello(age);
  }
}
