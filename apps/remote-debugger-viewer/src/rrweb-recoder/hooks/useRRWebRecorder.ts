import { useEffect, useRef, useState, useCallback } from 'react';
import { record } from 'rrweb';
import type { eventWithTime } from '@rrweb/types';

interface UseRRWebRecorderOptions {
  maxDurationMs?: number; // 최대 보관 시간 (기본: 60초)
  cleanupIntervalMs?: number; // 정리 주기 (기본: 1초)
  onError?: (error: Error) => void;
}

interface RecorderState {
  isRecording: boolean;
  eventCount: number;
  oldestEventTime: number | null;
  newestEventTime: number | null;
}

export function useRRWebRecorder(options: UseRRWebRecorderOptions = {}) {
  const {
    maxDurationMs = 60_000, // 60초
    cleanupIntervalMs = 1_000, // 1초
    onError,
  } = options;

  // 이벤트 저장소 (ref 사용 - 렌더링 트리거 없이 관리)
  const eventsRef = useRef<eventWithTime[]>([]);
  
  // 레코더 stop 함수
  const stopRecordingRef = useRef<(() => void) | undefined>(undefined);

  // cleanup 타이머
  const cleanupTimerRef = useRef<number | null>(null);

  // 상태 (UI 표시용)
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    eventCount: 0,
    oldestEventTime: null,
    newestEventTime: null,
  });

  /**
   * 오래된 이벤트 제거 (1분 이전 이벤트 삭제)
   */
  const cleanupOldEvents = useCallback(() => {
    const now = Date.now();
    const cutoffTime = now - maxDurationMs;

    const beforeCount = eventsRef.current.length;
    
    // cutoffTime보다 최근 이벤트만 유지
    eventsRef.current = eventsRef.current.filter(
      (event) => event.timestamp >= cutoffTime
    );

    const afterCount = eventsRef.current.length;
    const removedCount = beforeCount - afterCount;

    // 상태 업데이트
    if (eventsRef.current.length > 0) {
      setState((prev) => ({
        ...prev,
        eventCount: afterCount,
        oldestEventTime: eventsRef.current[0]?.timestamp || null,
        newestEventTime: eventsRef.current[afterCount - 1]?.timestamp || null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        eventCount: 0,
        oldestEventTime: null,
        newestEventTime: null,
      }));
    }

    if (removedCount > 0) {
      console.log(`[RRWeb] 🗑️  ${removedCount}개 오래된 이벤트 제거됨`);
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
      cleanupOldEvents();
    }, cleanupIntervalMs);

    console.log('[RRWeb] ⏰ Cleanup 타이머 시작 (1초마다 실행)');
  }, [cleanupOldEvents, cleanupIntervalMs]);

  /**
   * cleanup 타이머 중지
   */
  const stopCleanupTimer = useCallback(() => {
    if (cleanupTimerRef.current) {
      clearInterval(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
      console.log('[RRWeb] ⏰ Cleanup 타이머 중지');
    }
  }, []);

  /**
   * 이벤트 핸들러
   */
  const handleEvent = useCallback(
    (event: eventWithTime) => {
      // 새 이벤트 추가
      eventsRef.current.push(event);
      console.log('[RRWeb] ✅ 이벤트 추가', event);

      
      // 상태 업데이트
      setState((prev) => ({
        ...prev,
        eventCount: eventsRef.current.length,
        newestEventTime: event.timestamp,
        oldestEventTime: eventsRef.current[0]?.timestamp || event.timestamp,
      }));
    },
    []
  );

  /**
   * 레코딩 시작
   */
  const startRecording = useCallback(() => {
    if (state.isRecording) {
      console.warn('[RRWeb] 이미 레코딩 중입니다.');
      return;
    }

    try {
      // 기존 이벤트 초기화
      eventsRef.current = [];

      // rrweb 레코딩 시작
      // packFn은 제거: 전송 시점에만 pack을 적용하여 최적화
      stopRecordingRef.current = record({
        emit: handleEvent,
        checkoutEveryNms: 30_000, // 30초마다 full snapshot
        checkoutEveryNth: 200, // 200개 이벤트마다 full snapshot
        recordCanvas: true,
        collectFonts: true,
      });

      // cleanup 타이머 시작
      startCleanupTimer();

      setState((prev) => ({
        ...prev,
        isRecording: true,
      }));

      console.log('[RRWeb] ✅ 레코딩 시작 (최대 60초 유지)');
    } catch (error) {
      console.error('[RRWeb] 레코딩 시작 실패:', error);
      onError?.(error as Error);
    }
  }, [state.isRecording, handleEvent, startCleanupTimer, onError]);

  /**
   * 레코딩 중지
   */
  const stopRecording = useCallback(() => {
    if (!state.isRecording) {
      return;
    }

    try {
      // rrweb 레코딩 중지
      stopRecordingRef.current?.();
      stopRecordingRef.current = undefined;

      // cleanup 타이머 중지
      stopCleanupTimer();

      setState((prev) => ({
        ...prev,
        isRecording: false,
      }));

      console.log('[RRWeb] ⏹️  레코딩 중지');
    } catch (error) {
      console.error('[RRWeb] 레코딩 중지 실패:', error);
      onError?.(error as Error);
    }
  }, [state.isRecording, stopCleanupTimer, onError]);

  /**
   * 현재 이벤트 가져오기 (복사본)
   */
  const getEvents = useCallback((): eventWithTime[] => {
    return [...eventsRef.current];
  }, []);

  /**
   * 이벤트 초기화
   */
  const clearEvents = useCallback(() => {
    eventsRef.current = [];
    setState((prev) => ({
      ...prev,
      eventCount: 0,
      oldestEventTime: null,
      newestEventTime: null,
    }));
    console.log('[RRWeb] 🧹 이벤트 초기화');
  }, []);

  /**
   * 시간 범위 정보 가져오기
   */
  const getTimeRange = useCallback(() => {
    if (eventsRef.current.length === 0) {
      return { start: null, end: null, durationMs: 0 };
    }

    const start = eventsRef.current[0].timestamp;
    const end = eventsRef.current[eventsRef.current.length - 1].timestamp;
    
    return {
      start,
      end,
      durationMs: end - start,
    };
  }, []);

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      stopRecording();
      stopCleanupTimer();
    };
  }, [stopRecording, stopCleanupTimer]);

  return {
    // 상태
    isRecording: state.isRecording,
    eventCount: state.eventCount,
    oldestEventTime: state.oldestEventTime,
    newestEventTime: state.newestEventTime,
    
    // 메서드
    startRecording,
    stopRecording,
    getEvents,
    clearEvents,
    getTimeRange,
  };
}
