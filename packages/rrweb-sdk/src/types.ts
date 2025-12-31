import type { eventWithTime } from "@rrweb/types";

/**
 * rrweb SDK 설정 옵션
 */
export interface RRWebSDKConfig {
  /**
   * 이벤트 업로드를 위한 서버 엔드포인트 URL
   * @example "http://localhost:5543/rrweb/events"
   */
  serverUrl: string;

  /**
   * SDK 초기화 시 자동으로 녹화 시작
   * @default true
   */
  autoStart?: boolean;

  /**
   * 버퍼에 보관할 이벤트의 최대 지속 시간 (롤링 윈도우)
   * @default 60_000 (60초)
   */
  maxDuration?: number;

  /**
   * 사용자 정의 세션 ID (제공되지 않으면 자동 생성)
   */
  sessionId?: string;

  /**
   * UI 버튼 위치
   * @default "bottom-right"
   */
  uiPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";

  /**
   * rrweb 녹화 옵션
   */
  recordingOptions?: {
    checkoutEveryNms?: number;
    checkoutEveryNth?: number;
    recordCanvas?: boolean;
    collectFonts?: boolean;
    sampling?: {
      scroll?: number;
      mousemove?: number;
    };
  };

  /**
   * 업로드 실패 시 재시도 횟수
   * @default 3
   */
  maxRetryCount?: number;

  /**
   * 초기 재시도 지연 시간 (밀리초 단위, 지수 백오프)
   * @default 1_000
   */
  retryDelay?: number;

  /**
   * 녹화 시작 시 콜백
   */
  onRecordingStart?: () => void;

  /**
   * 녹화 중지 시 콜백
   */
  onRecordingStop?: () => void;

  /**
   * 업로드 성공 시 콜백
   */
  onUploadSuccess?: (sessionId: string, eventCount: number) => void;

  /**
   * 업로드 실패 시 콜백
   */
  onUploadError?: (error: Error) => void;

  /**
   * 일반 오류 발생 시 콜백
   */
  onError?: (error: Error) => void;
}

/**
 * 녹화 상태 정보
 */
export interface RecordingState {
  /**
   * 기록 중인지의 상태를 의미합니다.
   */
  isRecording: boolean;
  eventCount: number;
  /**
   * 가장 오래된 이벤트의 타임스탬프를 의미합니다.
   */
  oldestEventTime: number | null;
  /**
   * 가장 최근 이벤트의 타임스탬프를 의미합니다.
   */
  newestEventTime: number | null;
  /**
   * 세션 ID를 의미합니다.
   */
  sessionId: string;
  /**
   * 기록 시간을 의미합니다.
   */
  durationMs: number;
}

/**
 * 업로드 페이로드 형식 (서버 API와 일치)
 */
export interface UploadPayload {
  /**
   * 이벤트를 패킹한 압축된 문자열을 의미합니다.
   */
  packed: string;
  /**
   * 세션 ID를 의미합니다.
   */
  sessionId: string;
}

/**
 * 서버로부터의 업로드 응답
 */
export interface UploadResponse {
  /**
   * 세션 ID를 의미합니다.
   */
  sessionId: string;
  /**
   * 저장된 이벤트 갯수를 의미합니다.
   */
  saved?: number;
}
