import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import type { eventWithTime } from "@rrweb/types";
import type rrwebPlayerType from "rrweb-player";
import { useRef } from "react";

interface Props {
  emits: eventWithTime[];
}

/**
 * 재생 중인 DOM을 Chrome DevTools에서 검사할 수 있도록 도와주는 유틸리티
 */
const inspectReplayDOM = (playerController: rrwebPlayerType | null) => {
  if (!playerController) {
    console.warn("[RRWeb DevTools] 플레이어가 초기화되지 않았습니다.");
    return null;
  }

  const replayer = playerController.getReplayer();
  if (!replayer) {
    console.warn("[RRWeb DevTools] Replayer를 찾을 수 없습니다.");
    return null;
  }

  const iframe = replayer.iframe;
  if (!iframe) {
    console.warn("[RRWeb DevTools] iframe을 찾을 수 없습니다.");
    return null;
  }

  const iframeDocument = iframe.contentDocument;
  if (!iframeDocument) {
    console.warn("[RRWeb DevTools] iframe document에 접근할 수 없습니다.");
    return null;
  }

  // Chrome DevTools에서 확인할 수 있도록 전역 변수에 할당
  interface WindowWithRRWeb extends Window {
    __rrwebReplayDOM?: Document;
    __rrwebReplayWindow?: Window;
    __rrwebReplayer?: typeof replayer;
    __rrwebNetworkRequests?: Array<{
      tag: string;
      payload: unknown;
      timestamp: number;
    }>;
  }

  const win = window as unknown as WindowWithRRWeb;
  win.__rrwebReplayDOM = iframeDocument;
  win.__rrwebReplayWindow = iframe.contentWindow || undefined;
  win.__rrwebReplayer = replayer;

  console.log("✅ [RRWeb DevTools] 재생 DOM이 전역 변수에 할당되었습니다:");
  console.log("  - window.__rrwebReplayDOM: iframe 내부의 document");
  console.log("  - window.__rrwebReplayWindow: iframe 내부의 window");
  console.log("  - window.__rrwebReplayer: Replayer 인스턴스");
  console.log("");
  console.log("🔍 Chrome DevTools에서 확인하는 방법:");
  console.log("  1. Elements 탭에서 <iframe> 태그를 찾습니다");
  console.log("  2. iframe을 클릭하여 내부 DOM을 검사합니다");
  console.log("  3. 또는 Console에서 window.__rrwebReplayDOM을 입력합니다");

  return {
    document: iframeDocument,
    window: iframe.contentWindow,
    replayer,
    iframe,
  };
};

/**
 * 네트워크 요청 정보 추출 (커스텀 이벤트에서)
 */
const extractNetworkRequests = (events: eventWithTime[]) => {
  interface CustomEventData {
    tag?: string;
    payload?: unknown;
  }

  const networkRequests = events
    .filter((event) => event.type === 5) // EventType.Custom
    .map((event) => {
      const customEvent = event as eventWithTime & {
        data: CustomEventData;
      };
      if (
        customEvent.data?.tag === "network-fetch" ||
        customEvent.data?.tag === "network-xhr" ||
        customEvent.data?.tag === "network-request"
      ) {
        return {
          tag: customEvent.data.tag,
          payload: customEvent.data.payload,
          timestamp: event.timestamp,
        };
      }
      return null;
    })
    .filter((req): req is NonNullable<typeof req> => req !== null);

  if (networkRequests.length > 0) {
    console.log("🌐 [RRWeb DevTools] 발견된 네트워크 요청:", networkRequests);
    interface WindowWithRRWeb extends Window {
      __rrwebNetworkRequests?: Array<{
        tag: string;
        payload: unknown;
        timestamp: number;
      }>;
    }
    const win = window as unknown as WindowWithRRWeb;
    win.__rrwebNetworkRequests = networkRequests;
    console.log("  - window.__rrwebNetworkRequests에서 확인 가능");
  } else {
    console.log("⚠️ [RRWeb DevTools] 네트워크 요청이 기록되지 않았습니다.");
    console.log("  레코딩 시 네트워크 요청을 커스텀 이벤트로 기록해야 합니다.");
  }

  return networkRequests;
};

export function RrwebPlayer({ emits }: Props) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerControllerRef = useRef<rrwebPlayerType | null>(null);

  const handlePlay = () => {
    if (!playerRef.current) return;

    playerControllerRef.current = new rrwebPlayer({
      target: playerRef.current, // customizable root element
      props: {
        events: emits,
      },
    });
    playerControllerRef.current?.play();

    // 재생 시작 후 DOM 검사 가능하도록 설정
    setTimeout(() => {
      inspectReplayDOM(playerControllerRef.current);
      extractNetworkRequests(emits);
    }, 100);
  };

  const handleInspectDOM = () => {
    inspectReplayDOM(playerControllerRef.current);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <h1>Rrweb Player</h1>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={handlePlay}>Play</button>
        <button
          onClick={handleInspectDOM}
          style={{ marginLeft: "10px" }}
          title="Chrome DevTools에서 재생 DOM 검사하기"
        >
          🔍 DOM 검사
        </button>
      </div>
      <div style={{ width: "80vw", height: "80vh" }} ref={playerRef} />
      <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
        <p>💡 Chrome DevTools 사용법:</p>
        <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
          <li>Elements 탭에서 iframe 내부 DOM 검사 가능</li>
          <li>Console에서 window.__rrwebReplayDOM 접근 가능</li>
          <li>네트워크 요청은 커스텀 이벤트로 기록된 경우에만 확인 가능</li>
        </ul>
      </div>
    </div>
  );
}
