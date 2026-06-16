import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { StravaService } from './strava.service';

@Module({
  imports: [HttpModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, StravaService],
  exports: [ActivitiesService, StravaService],
})
export class ActivitiesModule {}
