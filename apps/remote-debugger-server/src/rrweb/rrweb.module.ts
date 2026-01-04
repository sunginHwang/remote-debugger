import { Module } from "@nestjs/common";
import { RrwebController } from "./rrweb.controller";
import { RrwebService } from "./rrweb.service";
import { SlackModule } from "../slack/slack.module";
import { JiraModule } from "../jira/jira.module";

@Module({
  imports: [SlackModule, JiraModule],
  controllers: [RrwebController],
  providers: [RrwebService],
})
export class RrwebModule {}
