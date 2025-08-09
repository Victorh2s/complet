import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
  });

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Complet NestJS API")
    .setDescription("The Complet API description")
    .setVersion("1.0")
    .addTag("users")
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
