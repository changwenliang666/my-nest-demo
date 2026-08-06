import { Module } from '@nestjs/common';
import { ModelService } from './models.service';
import { ModelController } from './models.controller';

@Module({
  providers: [ModelService],
  controllers: [ModelController]
})
export class ModelsModule {}
