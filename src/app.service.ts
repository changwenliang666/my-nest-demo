import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(age:number): string {
    return `Hello World!${age}`;
  }
}
