import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import type { eventWithTime } from "@rrweb/types";
import type rrwebPlayerType from "rrweb-player";
import { useRef, useState } from "react";
import { unpack } from "rrweb";

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

export function ReplayRrweb() {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerControllerRef = useRef<rrwebPlayerType | null>(null);
  const [replaySessionId, setReplaySessionId] = useState<string>("");

  const handlePlay = async () => {
    const events = await getEvents();
    if (!events) return;
    console.log("response", events);

    playerControllerRef.current = new rrwebPlayer({
      target: playerRef.current as HTMLElement, // customizable root element
      props: {
        events: events,
      },
    });
    playerControllerRef.current?.play();

    // // 재생 시작 후 DOM 검사 가능하도록 설정
    // setTimeout(() => {
    //   inspectReplayDOM(playerControllerRef.current);
    //   extractNetworkRequests(emits);
    // }, 100);
  };

  const getEvents = async () => {
    if (!replaySessionId) {
      alert("리플레이 세션 ID를 입력해주세요.");
      return null;
    }
    const response = await fetch(
      `http://localhost:5543/rrweb/events/${replaySessionId}`
    );
    const events = await response.json();
    const unpackedEvents = JSON.parse(events["eventData"]).packed as string[];
    return unpackedEvents.map((event) => unpack(event)) as eventWithTime[];
  };

  const handleInspectDOM = () => {
    inspectReplayDOM(playerControllerRef.current);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <h1>Rrweb Player</h1>
      <input
        type="text"
        placeholder="Replay Session ID"
        value={replaySessionId}
        onChange={(e) => setReplaySessionId(e.target.value)}
      />
      <button onClick={handlePlay}>리플레이 재생하기</button>

      <div style={{ width: "80vw", height: "80vh" }} ref={playerRef} />
    </div>
  );
}
