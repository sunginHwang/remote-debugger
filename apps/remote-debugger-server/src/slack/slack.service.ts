import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { getSlackConfig, slackPost } from "src/utils/slack/slack-client.util";
import {
  SlackPostMessageResponse,
  SlackPostMessagePayload,
} from "./interfaces/slack-api.interface";

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Slack에 알림 전송
   * @param message - 전송할 메시지
   * @param eventId - 이벤트 ID
   * @param channelId - 대상 채널 ID (선택사항)
   */
  async sendNotification({
    message,
    eventId,
    channelId,
  }: {
    message: string;
    eventId: number;
    channelId?: string;
  }): Promise<void> {
    try {
      const slackConfig = getSlackConfig();

      if (!slackConfig) {
        this.logger.warn("Slack 설정이 완료되지 않았습니다");
        return;
      }

      const targetChannelId = channelId || slackConfig.defaultChannelId;

      if (!targetChannelId) {
        this.logger.warn("Slack 채널 ID가 설정되지 않았습니다");
        return;
      }

      const payload: SlackPostMessagePayload = {
        channel: targetChannelId,
        text: message,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*RRWeb 이벤트 저장 완료*\n이벤트 ID: ${eventId}\n${message}`,
            },
          },
        ],
      };

      const response = await slackPost<SlackPostMessageResponse>(
        this.httpService,
        payload
      );

      if (!response) {
        this.logger.error("Slack 알림 전송 실패 - 응답이 존재하지 않습니다");
        return;
      }

      if (!response.ok) {
        throw new Error(`Slack API 오류: ${response.error || "Unknown error"}`);
      }

      this.logger.log(
        `Slack 알림 전송 완료: ${eventId} (채널: ${targetChannelId})`
      );
    } catch (error) {
      this.logger.error(`Slack 알림 전송 실패: ${error.message}`, error.stack);
      throw error;
    }
  }
}
