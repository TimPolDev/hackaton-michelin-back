import { Module } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { StravaService } from './strava.service';
import { STRAVA_API_CLIENT } from './strava/strava-api.client';
import { RealStravaApiClient } from './strava/real-strava-api.client';
import { MockStravaApiClient } from './strava/mock-strava-api.client';

@Module({
  imports: [HttpModule],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    StravaService,
    {
      // Pick the Strava client implementation from the STRAVA_MOCK flag.
      // STRAVA_MOCK=true -> in-memory mock (MVP, no real Strava app needed).
      provide: STRAVA_API_CLIENT,
      inject: [ConfigService, HttpService],
      useFactory: (config: ConfigService, http: HttpService) =>
        config.get('STRAVA_MOCK') === 'true'
          ? new MockStravaApiClient(config.get('STRAVA_REDIRECT_URI'))
          : new RealStravaApiClient(http, config),
    },
  ],
  exports: [ActivitiesService, StravaService],
})
export class ActivitiesModule {}
