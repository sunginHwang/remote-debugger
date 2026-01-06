import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { JiraService } from "./jira.service";
import { JiraController } from "./jira.controller";

@Module({
  imports: [HttpModule],
  providers: [JiraService],
  exports: [JiraService],
  controllers: [JiraController],
})
export class JiraModule {}
