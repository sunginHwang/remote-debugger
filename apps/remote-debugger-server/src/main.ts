import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// BigInt를 JSON으로 직렬화할 수 있도록 설정
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Session-Id"],
  });

  await app.listen(process.env.PORT ?? 5000);
}
void bootstrap();
