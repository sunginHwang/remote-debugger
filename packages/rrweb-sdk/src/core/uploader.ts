import { pack } from "rrweb";
import type { eventWithTime } from "@rrweb/types";
import type { UploadPayload, UploadResponse } from "../types";
import { delay } from "../utils/delay";
import { logger } from "../utils/logger";

export class EventUploader {
  constructor(
    private serverUrl: string,
    private maxRetryCount: number = 3,
    private retryDelay: number = 1000,
    private onSuccess?: (sessionId: string, eventCount: number) => void,
    private onError?: (error: Error) => void
  ) {}

  async send(
    events: eventWithTime[],
    sessionId: string,
    jiraProjectKey: string
  ): Promise<UploadResponse | null> {
    if (events.length === 0) {
      logger.log("전송할 이벤트가 없습니다.");
      return null;
    }

    try {
      // pack을 통한 압축
      const packed = events.map((event) => pack(event));

      const payload: UploadPayload = {
        packed: JSON.stringify({ packed }),
        sessionId,
        jiraProjectKey,
        userAgent: window.navigator.userAgent,
      };

      const response = await this.uploadRrwebEvent(payload);

      logger.log(
        `${response.saved || events.length}개의 이벤트를 전송했습니다. 세션 ID: ${response.sessionId}`
      );

      this.onSuccess?.(response.sessionId, response.saved || events.length);

      return response;
    } catch (error) {
      logger.error("전송 실패:", error);
      this.onError?.(error as Error);
      return null;
    }
  }

  private async uploadRrwebEvent(
    payload: UploadPayload
  ): Promise<UploadResponse> {
    let lastError: Error | null = null;

    for (let retryCount = 0; retryCount < this.maxRetryCount; retryCount++) {
      try {
        const response = await fetch(this.serverUrl, {
          method: "POST",
          mode: "cors",
          credentials: "omit", // credentials를 명시적으로 omit
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result: UploadResponse = await response.json();
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          `Upload attempt ${retryCount + 1}/${this.maxRetryCount} failed:`,
          error
        );

        const hasRetryCount = retryCount < this.maxRetryCount - 1;
        if (hasRetryCount) {
          const delayMs = this.retryDelay * Math.pow(2, retryCount);
          await delay(delayMs);
        }
      }
    }

    throw lastError || new Error("Upload failed after all retries");
  }
}
