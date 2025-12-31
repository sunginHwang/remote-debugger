import type { RRWebSDKConfig } from "./types";

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<
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
> = {
  autoStart: true,
  uploadInterval: 30000, // 30 seconds
  maxDuration: 60000, // 60 seconds
  showUI: true,
  uiPosition: "bottom-right",
  retryAttempts: 3,
  retryDelay: 1000,
  recordingOptions: {
    checkoutEveryNms: 30000, // Full snapshot every 30 seconds
    checkoutEveryNth: 200, // Full snapshot every 200 events
    recordCanvas: true,
    collectFonts: true,
  },
};

/**
 * Merge user config with defaults
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
    // Callbacks default to no-op
    onRecordingStart: userConfig.onRecordingStart || (() => {}),
    onRecordingStop: userConfig.onRecordingStop || (() => {}),
    onUploadSuccess: userConfig.onUploadSuccess || (() => {}),
    onUploadError: userConfig.onUploadError || (() => {}),
    onError: userConfig.onError || (() => {}),
    // Session ID and generator handled separately
    sessionId: userConfig.sessionId || "",
    generateSessionId: userConfig.generateSessionId || (() => ""),
  };
}
