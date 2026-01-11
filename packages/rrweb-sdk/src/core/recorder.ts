import { record } from "rrweb";
import type { eventWithTime } from "@rrweb/types";
import type { RecordingState } from "../types";
import { logger } from "../utils/logger";

const ONE_SECOND_MS = 1_000;
const ONE_MINUTE_MS = ONE_SECOND_MS * 60;

/**
 * 세션리플레이 기록 처리 담당
 */
export class RecordingManager {
  /**
   * rrweb 이벤트들의 상태를 정의합니다.
   */
  private events: eventWithTime[] = [];
  /**
   * rrweb 기록의 종료를 위한 함수입니다.
   */
  private stopFn: (() => void) | undefined;
  /**
   * 타이머의 클린업을 위해 사용합니다.
   */
  private cleanupTimer: number | null = null;
  /**
   * 현재 기록 중인지의 상태를 의미합니다.
   */
  private isRecording = false;

  constructor(
    private maxDurationMs: number = ONE_MINUTE_MS,
    private cleanupIntervalMs: number = ONE_SECOND_MS,
    private recordingOptions: {
      checkoutEveryNms?: number;
      checkoutEveryNth?: number;
      recordCanvas?: boolean;
      collectFonts?: boolean;
      sampling?: {
        scroll?: number;
        mousemove?: number;
      };
    } = {},
    private onError?: (error: Error) => void
  ) {}

  /**
   * rrweb 세션 기록을 시작하는 함수 입니다.
   */
  start() {
    if (this.isRecording) {
      logger.warn("Already recording");
      return;
    }

    try {
      // 시작전 이전의 잔여 이벤트 기록 초기화
      this.events = [];

      /**
       * rrweb 기록 시작
       * stopFn에 반환하는 이유는 추후 종료 처리를 위함.
       */
      this.stopFn = record({
        emit: this.handleEvent.bind(this),
        checkoutEveryNms: 30_000,
        checkoutEveryNth: 200,
        recordCanvas: false,
        ...this.recordingOptions,
      });

      // Start cleanup timer
      this.startCleanupTimer();

      this.isRecording = true;
      logger.log("Recording started");
    } catch (error) {
      logger.error("Failed to start recording:", error);
      this.onError?.(error as Error);
    }
  }

  /**
   * 기록 중지
   */
  stop() {
    if (!this.isRecording) {
      return;
    }

    try {
      this.stopFn?.();
      this.stopFn = undefined;
      this.stopCleanupTimer();
      this.isRecording = false;
      logger.log("Recording stopped");
    } catch (error) {
      logger.error("Failed to stop recording:", error);
      this.onError?.(error as Error);
    }
  }

  /**
   * 현재 저장된 모든 이벤트를 조회합니다.
   */
  getEvents(): eventWithTime[] {
    return [...this.events];
  }

  /**
   * Remove uploaded events from buffer
   */
  clearUploadedEvents(uploadedEvents: eventWithTime[]): void {
    const uploadedTimestamps = new Set(uploadedEvents.map((e) => e.timestamp));
    this.events = this.events.filter(
      (e) => !uploadedTimestamps.has(e.timestamp)
    );
  }

  /**
   * 현재 recoder의 상태를 반환합니다.
   */
  getState(): RecordingState {
    const eventCount = this.events.length;
    const oldestEventTime =
      eventCount > 0 ? (this.events[0]?.timestamp ?? null) : null;
    const newestEventTime =
      eventCount > 0 ? (this.events[eventCount - 1]?.timestamp ?? null) : null;
    const durationMs =
      oldestEventTime && newestEventTime
        ? newestEventTime - oldestEventTime
        : 0;

    return {
      isRecording: this.isRecording,
      eventCount,
      oldestEventTime,
      newestEventTime,
      sessionId: "",
      durationMs,
    };
  }

  /**
   * Event handler
   */
  private handleEvent(event: eventWithTime): void {
    this.events.push(event);
  }

  /**
   * 최대 maxDurationMs 이상 이벤트를 적재하지 못하도록
   * 주기적 클린업을 실행하는 함수
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.removeOldEvents();
    }, this.cleanupIntervalMs) as unknown as number;
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * maxDurationMs 이상 지난 이벤트들을 삭제처리하여
   * 일정 갯수 이상의 event가 적재되지 않도록 합니다.
   */
  private removeOldEvents() {
    const now = Date.now();
    const cutoffTime = now - this.maxDurationMs;
    this.events = this.events.filter((event) => event.timestamp >= cutoffTime);
  }

  /**
   * 전체 초기화작업을 진행합니다.
   */
  destroy(): void {
    this.stop();
    this.stopCleanupTimer();
    this.events = [];
  }
}
