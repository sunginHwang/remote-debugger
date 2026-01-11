import type { RRWebSDKConfig } from "../types";

type DefaultConfig = Required<
  Omit<
    RRWebSDKConfig,
    | "serverUrl"
    | "sessionId"
    | "generateSessionId"
    | "onRecordingStart"
    | "onRecordingStop"
    | "onUploadSuccess"
    | "onUploadError"
    | "onError"
  >
>;

/**
 * 기본 옵션 타입 정의
 */
export const DEFAULT_CONFIG: DefaultConfig = {
  autoStart: true,
  maxDuration: 60_000, // 60 seconds
  uiPosition: "bottom-right",
  uiContainerId: "rrweb-sdk-ui-root",
  maxRetryCount: 3,
  retryDelay: 1_000,
  recordingOptions: {
    // 30초 단위 풀 스냅샷
    checkoutEveryNms: 30_000,
    // 200개 이벤트 단위 풀 스냅샷
    checkoutEveryNth: 200,
    recordCanvas: true,
    collectFonts: true,
  },
};

/**
 * sdk 사용 옵션 + 기본 옵션값을 합쳐서 반환합니다.
 */
export function mergeConfig(
  userConfig: RRWebSDKConfig
): Required<RRWebSDKConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    recordingOptions: {
      ...DEFAULT_CONFIG.recordingOptions,
      ...userConfig.recordingOptions,
    },
    onRecordingStart: userConfig.onRecordingStart || (() => {}),
    onRecordingStop: userConfig.onRecordingStop || (() => {}),
    onUploadSuccess: userConfig.onUploadSuccess || (() => {}),
    onUploadError: userConfig.onUploadError || (() => {}),
    onError: userConfig.onError || (() => {}),
    sessionId: userConfig.sessionId || "",
  };
}
