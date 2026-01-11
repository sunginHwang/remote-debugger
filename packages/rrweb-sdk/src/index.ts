import { RRWebSDK } from "./core/sdk";
import type { RRWebSDKConfig } from "./types";

/**
 * rrweb 기록 및 upload를 위한 sdk 함수입니다.
 *
 * @example
 * ```typescript
 * import { initRRWebSDK } from '@repo/rrweb-sdk';
 *
 * const sdk = initRRWebSDK({
 *   serverUrl: 'http://localhost:5543/rrweb/events',
 * });
 * ```
 */
export function initRRWebSDK(config: RRWebSDKConfig): RRWebSDK {
  return new RRWebSDK(config);
}

// Re-export SDK class
export { RRWebSDK } from "./core/sdk";

// Re-export types for consumers
export type {
  RRWebSDKConfig,
  RecordingState,
  UploadPayload,
  UploadResponse,
} from "./types";
