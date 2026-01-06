import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";

// BigInt를 JSON으로 직렬화할 수 있도록 설정
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    bodyParser.json({
      limit: "10mb",
    })
  );

  // CORS 설정 - 모든 origin, 헤더, 메서드 허용
  app.enableCors({
    origin: (origin, callback) => {
      // 모든 origin 허용
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: "*",
    exposedHeaders: "*",
  });

  await app.listen(process.env.PORT ?? 5000);
}
void bootstrap();
