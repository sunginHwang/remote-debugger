import { pack } from "rrweb";
import type { eventWithTime } from "@rrweb/types";
import type { UploadPayload, UploadResponse } from "./types";
import { delay } from "./utils/delay";

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
    sessionId: string
  ): Promise<UploadResponse | null> {
    if (events.length === 0) {
      console.log("[RRWeb SDK] 전송할 이벤트가 없습니다.");
      return null;
    }

    try {
      // pack을 통한 압축
      const packed = events.map((event) => pack(event));

      const payload: UploadPayload = {
        packed: JSON.stringify({ packed }),
        sessionId,
      };

      const response = await this.uploadRrwebEvent(payload);

      console.log(
        `[RRWeb SDK] ${response.saved || events.length}개의 이벤트를 전송했습니다. 세션 ID: ${response.sessionId}`
      );

      this.onSuccess?.(response.sessionId, response.saved || events.length);

      return response;
    } catch (error) {
      console.error("[RRWeb SDK] 전송 실패:", error);
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
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
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
        console.warn(
          `[RRWeb SDK] Upload attempt ${retryCount + 1}/${this.maxRetryCount} failed:`,
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
