import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

/**
 * Slack API 설정 인터페이스
 */
export interface SlackConfig {
  slackChatLink: string;
  slackBotToken: string;
  defaultChannelId?: string;
}

/**
 * 환경변수에서 Slack 설정을 가져옵니다.
 * @returns Slack 설정 객체 또는 null (설정이 불완전한 경우)
 */
export function getSlackConfig(): SlackConfig | null {
  const slackChatLink = process.env.SLACK_CHAT_LINK;
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  const defaultChannelId = process.env.SLACK_CHANNEL_ID;

  if (!slackChatLink || !slackBotToken) {
    return null;
  }

  return {
    slackChatLink,
    slackBotToken,
    defaultChannelId,
  };
}

/**
 * Slack API 호출을 위한 인증 헤더를 생성합니다.
 * @param slackBotToken - Slack Bot 토큰
 * @returns HTTP 헤더 객체
 */
export function createSlackAuthHeaders(
  slackBotToken: string
): Record<string, string> {
  return {
    Authorization: `Bearer ${slackBotToken}`,
    "Content-Type": "application/json",
  };
}

/**
 * Slack API POST 요청을 수행합니다.
 * @param httpService - NestJS HttpService 인스턴스
 * @param data - 요청 바디 데이터
 * @returns 응답 데이터 또는 null (설정이 불완전한 경우)
 */
export async function slackPost<T>(
  httpService: HttpService,
  data: any
): Promise<T | null> {
  const slackConfig = getSlackConfig();

  if (!slackConfig) {
    return null;
  }

  const { slackChatLink, slackBotToken } = slackConfig;
  const headers = createSlackAuthHeaders(slackBotToken);

  const response = await firstValueFrom(
    httpService.post<T>(slackChatLink, data, { headers })
  );

  return response.data;
}
