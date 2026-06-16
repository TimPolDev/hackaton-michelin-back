import { Module } from '@nestjs/common';
import { AmbassadorsController } from './ambassadors.controller';
import { AmbassadorsService } from './ambassadors.service';

@Module({
  controllers: [AmbassadorsController],
  providers: [AmbassadorsService],
  exports: [AmbassadorsService],
})
export class AmbassadorsModule {}
