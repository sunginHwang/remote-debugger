import { Module } from "@nestjs/common";
import { RrwebModule } from "./rrweb/rrweb.module";
import { PrismaModule } from "./prisma/prisma.module";
import { JiraModule } from "./jira/jira.module";

@Module({
  imports: [PrismaModule, RrwebModule, JiraModule],
})
export class AppModule {}
