/**
 * 녹화 상태 정보
 */
export interface RecordingState {
  /**
   * 기록 중인지의 상태를 의미합니다.
   */
  isRecording: boolean;
  /**
   * 기록된 이벤트 갯수를 의미합니다.
   */
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
