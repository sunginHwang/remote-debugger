import React, { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { RecordingManager } from "./recorder";
import { EventUploader } from "./uploader";
import { mergeConfig } from "./config";
import { UIManager } from "../ui/UIManager";
import { generateSessionId as defaultGenerateSessionId } from "../utils/session";
import { logger } from "../utils/logger";
import type { RRWebSDKConfig, RecordingState } from "../types";

export class RRWebSDK {
  private recorder: RecordingManager;
  private uploader: EventUploader;
  private uiContainer: HTMLDivElement | null = null;
  private uiRoot: Root | null = null;
  private config: Required<RRWebSDKConfig>;
  private sessionId: string;
  private isDestroyed = false;

  constructor(userConfig: RRWebSDKConfig) {
    this.config = mergeConfig(userConfig);

    this.sessionId = this.config.sessionId || defaultGenerateSessionId();

    // rrweb 초기화
    this.recorder = new RecordingManager(
      this.config.maxDuration,
      1_000,
      this.config.recordingOptions,
      this.config.onError
    );

    // event uploader 초기화
    this.uploader = new EventUploader(
      this.config.serverUrl,
      this.config.maxRetryCount,
      this.config.retryDelay,
      this.config.onUploadSuccess,
      this.config.onUploadError
    );

    this.initializeUI();

    // 자동 기록 시작 옵션이 활성화된 경우 기록 시작
    if (this.config.autoStart) {
      this.start();
    }

    logger.log(`Initialized with session ID: ${this.sessionId}`);
  }

  /**
   * 기록 시작
   */
  start() {
    this.recorder.start();
    this.config.onRecordingStart();
  }

  /**
   * 기록 중지
   */
  stop() {
    this.recorder.stop();
    this.config.onRecordingStop();
  }

  /**
   * 기록된 이벤트 전송
   */
  async uploadRrwebEvents(projectKey: string) {
    const events = this.recorder.getEvents();
    if (events.length === 0) {
      logger.log("전송할 이벤트가 없습니다.");
      return;
    }

    const result = await this.uploader.send(events, this.sessionId, projectKey);

    if (result) {
      this.recorder.clearUploadedEvents(events);
    }
  }

  /**
   * 현재의 기록 상태값을 반환합니다.
   */
  getState(): RecordingState {
    const state = this.recorder.getState();
    return {
      ...state,
      sessionId: this.sessionId,
    };
  }

  /**
   * 전체 초기화 작업을 진행합니다.
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    // 기록 중지 및 전체 초기화
    this.recorder.destroy();

    // UI 초기화
    if (this.uiRoot) {
      this.uiRoot.unmount();
      this.uiRoot = null;
    }

    if (this.uiContainer) {
      this.uiContainer.remove();
      this.uiContainer = null;
    }

    this.isDestroyed = true;
  }

  /**
   * 디버거 sdk wrapper container 생성
   */
  private createUIContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "rrweb-sdk-ui-root";
    document.body.appendChild(container);
    return container;
  }

  /**
   * 디버거 sdk UI 컨테이너   초기화
   */
  private initializeUI(): void {
    this.uiContainer = this.createUIContainer();

    this.uiRoot = createRoot(this.uiContainer);
    this.uiRoot.render(
      createElement(UIManager, {
        getState: () => this.getState(),
        onUploadRrwebEvents: (projectKey: string) =>
          this.uploadRrwebEvents(projectKey),
      })
    );
  }
}
