/* eslint-disable @typescript-eslint/require-await */
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaService } from "./database/prisma.service";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-ioredis";
import { ConfigModule } from "@nestjs/config";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import { APP_FILTER } from "@nestjs/core";
import { MailerModule } from "@nestjs-modules/mailer";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env"],
    }),
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: redisStore,
        host: "localhost",
        port: 6379,
        ttl: 60,
      }),
    }),
    SentryModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        service: process.env.EMAIL_SERVICE,
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"Complet - Prowtech Solutions" <${process.env.EMAIL}>`,
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
