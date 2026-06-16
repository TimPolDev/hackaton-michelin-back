import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD} from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { AdminGuard } from './common/guards/admin.guard';
import { CyclistsModule } from './modules/cyclists/cyclists.module';
import { AuthModule } from './modules/auth/auth.module';
import { TiresModule } from './modules/tires/tires.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { AmbassadorsModule } from './modules/ambassadors/ambassadors.module';
import { ActivitiesModule } from './modules/activities/activities.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    CyclistsModule,
    ActivitiesModule,
    TiresModule,
    RecommendationsModule,
    ClubsModule,
    AmbassadorsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard, // Global auth guard
    },
    {
      provide: APP_GUARD,
      useClass: AdminGuard, // Global admin guard
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Global rate limiting
    },
  ],
})
export class AppModule {}
