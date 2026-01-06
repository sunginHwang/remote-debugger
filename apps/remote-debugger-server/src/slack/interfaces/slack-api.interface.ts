/**
 * Slack API 응답 타입 정의
 * Slack Web API 스펙 기반
 */

/**
 * Slack chat.postMessage API 응답
 */
export interface SlackPostMessageResponse {
  /** 요청 성공 여부 */
  ok: boolean;
  /** 채널 ID */
  channel?: string;
  /** 타임스탬프 */
  ts?: string;
  /** 에러 메시지 (ok: false인 경우) */
  error?: string;
  /** 경고 메시지 */
  warning?: string;
}

/**
 * Slack 메시지 블록 - Section
 */
export interface SlackBlockSection {
  type: "section";
  text: {
    type: "mrkdwn" | "plain_text";
    text: string;
  };
}

/**
 * Slack 메시지 요청 페이로드
 */
export interface SlackPostMessagePayload {
  /** 채널 ID */
  channel: string;
  /** 메시지 텍스트 (폴백용) */
  text: string;
  /** 메시지 블록 */
  blocks?: SlackBlockSection[];
}
