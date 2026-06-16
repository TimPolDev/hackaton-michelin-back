import { Module } from '@nestjs/common';
import { CyclistsController } from './cyclists.controller';
import { CyclistsService } from './cyclists.service';

@Module({
  controllers: [CyclistsController],
  providers: [CyclistsService],
  exports: [CyclistsService],
})
export class CyclistsModule {}
