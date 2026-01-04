import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Slack에 알림 전송
   * @param message - 전송할 메시지
   * @param sessionId - 세션 ID
   */
  async sendNotification(
    message: string,
    sessionId: string,
    channelId?: string
  ): Promise<void> {
    try {
      const slackChatLink = process.env.SLACK_CHAT_LINK;
      const slackBotToken = process.env.SLACK_BOT_TOKEN;
      const defaultChannelId = process.env.SLACK_CHANNEL_ID;
      const targetChannelId = channelId || defaultChannelId;

      if (!slackChatLink || !slackBotToken) {
        this.logger.warn(
          "SLACK_API_URL 또는 SLACK_BOT_TOKEN이 설정되지 않았습니다."
        );
        return;
      }

      if (!targetChannelId) {
        this.logger.warn("SLACK_CHANNEL_ID가 설정되지 않았습니다.");
        return;
      }

      const response = await firstValueFrom(
        this.httpService.post(
          slackChatLink,
          {
            channel: targetChannelId,
            text: message,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*RRWeb 이벤트 저장 완료*\n세션 ID: ${sessionId}\n${message}`,
                },
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${slackBotToken}`,
              "Content-Type": "application/json",
            },
          }
        )
      );

      if (!response.data.ok) {
        throw new Error(
          `Slack API 오류: ${response.data.error || "Unknown error"}`
        );
      }

      this.logger.log(
        `Slack 알림 전송 완료: ${sessionId} (채널: ${targetChannelId})`
      );
    } catch (error) {
      this.logger.error(`Slack 알림 전송 실패: ${error.message}`, error.stack);
      throw error;
    }
  }
}
