  import { useState } from 'react'
  import reactLogo from '../../assets/react.svg'
  import viteLogo from '/vite.svg'
  import type { eventWithTime } from '@rrweb/types';
  import { pack } from 'rrweb';

  export interface SampleComponentProps {
    onStartRecording: () => void;
    onStopRecording: () => void;
    onSwitchToPlayer: () => void;
    onSaveEventsToState: () => void;
    events: eventWithTime[];
  }

  export function SampleComponent({ events, onStartRecording, onStopRecording, onSaveEventsToState,onSwitchToPlayer }: SampleComponentProps) {
    const [count, setCount] = useState(0);
    const [isSaveLoading, setIsSaveLoading] = useState(false);

    const handleStartRecording = () => {
      onStartRecording();
    };

    const handleStopRecording = () => {
      onStopRecording();
    };

    const handleSaveToServer = async () => {
      if (isSaveLoading) return;
      if (events.length === 0) {
        console.warn('저장할 이벤트가 없습니다.');
        return;
      }

      setIsSaveLoading(true);
      try {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 각 이벤트를 pack하여 배열로 만든 후 한 번에 전송
        const packed = events.map((event) => pack(event));

        const response = await fetch('http://localhost:5000/rrweb/events', {
          method: 'POST',
          body: JSON.stringify({ packed, sessionId }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ ${result.saved || events.length}개 이벤트가 pack되어 전송되었습니다. Session ID: ${result.sessionId || sessionId}`);
      } catch (error) {
        console.error('서버 저장 실패:', error);
      } finally {
        setIsSaveLoading(false);
      }
    };

    return (
      <>
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
        <button onClick={handleStartRecording}>Start Recording</button>
        <button onClick={handleStopRecording}>Stop Recording</button>
        <button onClick={onSwitchToPlayer}>Switch to Player</button>
        <button onClick={onSaveEventsToState}>이벤트 state에 저장하기</button>
        <button onClick={handleSaveToServer}>{isSaveLoading ? '저장중...' : '서버 저장하기'}</button>
      </>
    )
  }

