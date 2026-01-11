import { useCallback, useState, useRef, useEffect } from "react";
import { record, EventType } from "rrweb";
// 기존 코드와 동일한 방식으로 import
import type { eventWithTime } from "@rrweb/types";
// rrweb-snapshot 타입은 rrweb 패키지의 의존성으로 포함됨
// 별도 설치: pnpm add rrweb-snapshot@2.0.0-alpha.4
import type { serializedNodeWithId } from "rrweb-snapshot";

interface UseRRWebSnapshotOptions {
  maskAllInputs?: boolean;
  maskTextClass?: string;
  blockClass?: string;
  onError?: (error: Error) => void;
  // 60초 sliding window 옵션
  maxDurationMs?: number; // 최대 보관 시간 (기본: 60초)
  snapshotIntervalMs?: number; // 스냅샷 생성 주기 (기본: 60000ms = 60초)
  cleanupIntervalMs?: number; // 정리 주기 (기본: 1000ms = 1초)
  autoStart?: boolean; // 자동 시작 여부 (기본: false)
}

interface SnapshotState {
  snapshots: Array<{
    snapshot: serializedNodeWithId;
    timestamp: number;
    meta: eventWithTime;
    fullSnapshot: eventWithTime;
  }>;
  snapshotCount: number;
  oldestSnapshotTime: number | null;
  newestSnapshotTime: number | null;
  isRunning: boolean;
}

/**
 * rrweb을 사용하여 스냅샷만 기록하는 훅 (60초 sliding window 지원)
 *
 * 이점:
 * - 이벤트 리스너를 즉시 중지하여 메모리 사용량 최소화
 * - 스냅샷 생성에만 집중
 * - 60초 단위로 주기적 스냅샷 생성 및 자동 정리
 * - 다른 프로젝트의 플레이어와 호환되는 형식으로 반환
 *
 * 참고: 순수 rrweb-snapshot만 사용하려면 별도 설치 필요
 * pnpm add rrweb-snapshot@2.0.0-alpha.4
 */
export function useRRWebSnapshot(options: UseRRWebSnapshotOptions = {}) {
  const {
    maskAllInputs = false,
    maskTextClass,
    blockClass,
    onError,
    maxDurationMs = 60000, // 60초
    snapshotIntervalMs = 60000, // 60초마다 스냅샷 생성
    cleanupIntervalMs = 1000, // 1초마다 정리
    autoStart = false,
  } = options;

  // 스냅샷 저장소 (ref 사용 - 렌더링 트리거 없이 관리)
  const snapshotsRef = useRef<
    Array<{
      snapshot: serializedNodeWithId;
      timestamp: number;
      meta: eventWithTime;
      fullSnapshot: eventWithTime;
    }>
  >([]);

  // 스냅샷 생성 타이머
  const snapshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // cleanup 타이머
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<SnapshotState>({
    snapshots: [],
    snapshotCount: 0,
    oldestSnapshotTime: null,
    newestSnapshotTime: null,
    isRunning: false,
  });

  /**
   * 현재 DOM의 스냅샷 생성
   * record()를 사용하지만 즉시 중지하여 스냅샷만 생성
   */
  const takeSnapshot = useCallback((): Promise<{
    meta: eventWithTime;
    snapshot: eventWithTime;
    rawSnapshot: serializedNodeWithId;
  } | null> => {
    return new Promise((resolve) => {
      try {
        const now = Date.now();
        let capturedSnapshot: serializedNodeWithId | null = null;

        // record()를 시작하여 스냅샷 생성
        const stopRecording = record({
          emit: (event: eventWithTime) => {
            // FullSnapshot 이벤트만 캡처
            if (event.type === EventType.FullSnapshot) {
              // FullSnapshot의 data는 { node, initialOffset } 형태
              const snapshotData = event.data as {
                node: serializedNodeWithId;
                initialOffset: { top: number; left: number };
              };
              capturedSnapshot = snapshotData.node;
            }
          },
          maskAllInputs,
          maskTextClass,
          blockClass,
          // 이벤트 추적 최소화
          checkoutEveryNth: Number.MAX_SAFE_INTEGER,
          checkoutEveryNms: Number.MAX_SAFE_INTEGER,
        });

        // 즉시 스냅샷 생성
        record.takeFullSnapshot(true);

        // 약간의 지연 후 스냅샷 데이터 확인 및 레코딩 중지
        setTimeout(() => {
          stopRecording?.();

          if (capturedSnapshot) {
            const metaEvent: eventWithTime = {
              type: EventType.Meta,
              data: {
                href: window.location.href,
                width: window.innerWidth,
                height: window.innerHeight,
              },
              timestamp: now,
            };

            const fullSnapshotEvent: eventWithTime = {
              type: EventType.FullSnapshot,
              data: {
                node: capturedSnapshot,
                initialOffset: {
                  top: 0,
                  left: 0,
                },
              },
              timestamp: now,
            };

            // 스냅샷을 배열에 추가
            const snapshotData = {
              snapshot: capturedSnapshot,
              timestamp: now,
              meta: metaEvent,
              fullSnapshot: fullSnapshotEvent,
            };

            snapshotsRef.current.push(snapshotData);

            // 상태 업데이트
            setState((prev) => ({
              ...prev,
              snapshots: [...snapshotsRef.current],
              snapshotCount: snapshotsRef.current.length,
              oldestSnapshotTime: snapshotsRef.current[0]?.timestamp || now,
              newestSnapshotTime: now,
            }));

            // 노드 개수 계산 (재귀적으로)
            const countNodes = (node: serializedNodeWithId): number => {
              let count = 1;
              if ("childNodes" in node && Array.isArray(node.childNodes)) {
                count += node.childNodes.reduce(
                  (sum, child) =>
                    sum + countNodes(child as serializedNodeWithId),
                  0
                );
              }
              return count;
            };

            console.log("[RRWeb Snapshot] ✅ 스냅샷 생성 완료", {
              timestamp: now,
              nodeCount: countNodes(capturedSnapshot),
              totalSnapshots: snapshotsRef.current.length,
            });

            resolve({
              meta: metaEvent,
              snapshot: fullSnapshotEvent,
              rawSnapshot: capturedSnapshot,
            });
          } else {
            console.warn(
              "[RRWeb Snapshot] 스냅샷 데이터를 캡처하지 못했습니다"
            );
            resolve(null);
          }
        }, 50);
      } catch (error) {
        console.error("[RRWeb Snapshot] 스냅샷 생성 실패:", error);
        onError?.(error as Error);
        resolve(null);
      }
    });
  }, [maskAllInputs, maskTextClass, blockClass, onError]);

  /**
   * 오래된 스냅샷 제거 (60초 이전 스냅샷 삭제)
   */
  const cleanupOldSnapshots = useCallback(() => {
    const now = Date.now();
    const cutoffTime = now - maxDurationMs;

    const beforeCount = snapshotsRef.current.length;

    // cutoffTime보다 최근 스냅샷만 유지
    snapshotsRef.current = snapshotsRef.current.filter(
      (snapshot) => snapshot.timestamp >= cutoffTime
    );

    const afterCount = snapshotsRef.current.length;
    const removedCount = beforeCount - afterCount;

    // 상태 업데이트
    if (snapshotsRef.current.length > 0) {
      setState((prev) => ({
        ...prev,
        snapshots: [...snapshotsRef.current],
        snapshotCount: afterCount,
        oldestSnapshotTime: snapshotsRef.current[0]?.timestamp || null,
        newestSnapshotTime:
          snapshotsRef.current[afterCount - 1]?.timestamp || null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        snapshots: [],
        snapshotCount: 0,
        oldestSnapshotTime: null,
        newestSnapshotTime: null,
      }));
    }

    if (removedCount > 0) {
      console.log(
        `[RRWeb Snapshot] 🗑️  ${removedCount}개 오래된 스냅샷 제거됨`
      );
    }
  }, [maxDurationMs]);

  /**
   * cleanup 타이머 시작
   */
  const startCleanupTimer = useCallback(() => {
    if (cleanupTimerRef.current) {
      clearInterval(cleanupTimerRef.current);
    }

    cleanupTimerRef.current = setInterval(() => {
      cleanupOldSnapshots();
    }, cleanupIntervalMs);

    console.log(
      `[RRWeb Snapshot] ⏰ Cleanup 타이머 시작 (${cleanupIntervalMs}ms마다 실행)`
    );
  }, [cleanupOldSnapshots, cleanupIntervalMs]);

  /**
   * cleanup 타이머 중지
   */
  const stopCleanupTimer = useCallback(() => {
    if (cleanupTimerRef.current) {
      clearInterval(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
      console.log("[RRWeb Snapshot] ⏰ Cleanup 타이머 중지");
    }
  }, []);

  /**
   * 스냅샷 생성 타이머 시작
   */
  const startSnapshotTimer = useCallback(() => {
    if (snapshotTimerRef.current) {
      clearInterval(snapshotTimerRef.current);
    }

    // 즉시 첫 스냅샷 생성
    takeSnapshot();

    // 주기적으로 스냅샷 생성
    snapshotTimerRef.current = setInterval(() => {
      takeSnapshot();
    }, snapshotIntervalMs);

    console.log(
      `[RRWeb Snapshot] ⏰ 스냅샷 생성 타이머 시작 (${snapshotIntervalMs}ms마다 실행)`
    );
  }, [takeSnapshot, snapshotIntervalMs]);

  /**
   * 스냅샷 생성 타이머 중지
   */
  const stopSnapshotTimer = useCallback(() => {
    if (snapshotTimerRef.current) {
      clearInterval(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
      console.log("[RRWeb Snapshot] ⏰ 스냅샷 생성 타이머 중지");
    }
  }, []);

  /**
   * 주기적 스냅샷 생성 시작
   */
  const startPeriodicSnapshots = useCallback(() => {
    if (state.isRunning) {
      console.warn("[RRWeb Snapshot] 이미 실행 중입니다.");
      return;
    }

    startSnapshotTimer();
    startCleanupTimer();

    setState((prev) => ({
      ...prev,
      isRunning: true,
    }));

    console.log(
      "[RRWeb Snapshot] ✅ 주기적 스냅샷 생성 시작 (60초 sliding window)"
    );
  }, [state.isRunning, startSnapshotTimer, startCleanupTimer]);

  /**
   * 주기적 스냅샷 생성 중지
   */
  const stopPeriodicSnapshots = useCallback(() => {
    if (!state.isRunning) {
      return;
    }

    stopSnapshotTimer();
    stopCleanupTimer();

    setState((prev) => ({
      ...prev,
      isRunning: false,
    }));

    console.log("[RRWeb Snapshot] ⏹️  주기적 스냅샷 생성 중지");
  }, [state.isRunning, stopSnapshotTimer, stopCleanupTimer]);

  /**
   * 스냅샷 초기화
   */
  const clearSnapshots = useCallback(() => {
    snapshotsRef.current = [];
    setState((prev) => ({
      ...prev,
      snapshots: [],
      snapshotCount: 0,
      oldestSnapshotTime: null,
      newestSnapshotTime: null,
    }));
    console.log("[RRWeb Snapshot] 🧹 모든 스냅샷 초기화");
  }, []);

  /**
   * 모든 스냅샷 가져오기 (복사본)
   */
  const getSnapshots = useCallback((): Array<{
    meta: eventWithTime;
    snapshot: eventWithTime;
    rawSnapshot: serializedNodeWithId;
    timestamp: number;
  }> => {
    return snapshotsRef.current.map((item) => ({
      meta: item.meta,
      snapshot: item.fullSnapshot,
      rawSnapshot: item.snapshot,
      timestamp: item.timestamp,
    }));
  }, []);

  /**
   * 최신 스냅샷 가져오기
   */
  const getLatestSnapshot = useCallback((): eventWithTime | null => {
    if (snapshotsRef.current.length === 0) {
      return null;
    }

    const latest = snapshotsRef.current[snapshotsRef.current.length - 1];
    return latest.fullSnapshot;
  }, []);

  /**
   * 시간 범위 정보 가져오기
   */
  const getTimeRange = useCallback(() => {
    if (snapshotsRef.current.length === 0) {
      return { start: null, end: null, durationMs: 0 };
    }

    const start = snapshotsRef.current[0].timestamp;
    const end = snapshotsRef.current[snapshotsRef.current.length - 1].timestamp;

    return {
      start,
      end,
      durationMs: end - start,
    };
  }, []);

  /**
   * 자동 시작 옵션이 활성화된 경우 시작
   */
  useEffect(() => {
    if (autoStart) {
      startPeriodicSnapshots();
    }

    return () => {
      stopPeriodicSnapshots();
      stopCleanupTimer();
    };
  }, [
    autoStart,
    startPeriodicSnapshots,
    stopPeriodicSnapshots,
    stopCleanupTimer,
  ]);

  return {
    // 상태
    snapshots: state.snapshots,
    snapshotCount: state.snapshotCount,
    oldestSnapshotTime: state.oldestSnapshotTime,
    newestSnapshotTime: state.newestSnapshotTime,
    isRunning: state.isRunning,

    // 메서드
    takeSnapshot, // 단일 스냅샷 생성
    startPeriodicSnapshots, // 주기적 스냅샷 생성 시작
    stopPeriodicSnapshots, // 주기적 스냅샷 생성 중지
    clearSnapshots, // 모든 스냅샷 초기화
    getSnapshots, // 모든 스냅샷 가져오기
    getLatestSnapshot, // 최신 스냅샷 가져오기
    getTimeRange, // 시간 범위 정보
  };
}
