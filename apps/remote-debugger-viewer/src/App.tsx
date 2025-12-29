import { useState } from 'react';
import './App.css';
import { SampleComponent } from './components/sample-component/SampleComponent';
import { RrwebPlayer } from './rrweb-player/RrwebPlayer';
import { useRRWebRecorder } from './rrweb-recoder/hooks/useRRWebRecorder';
import type { eventWithTime } from '@rrweb/types';

function App() {
  const recorder = useRRWebRecorder();
  const [events, setEvents] = useState<eventWithTime[]>([]);
  const [mode, setMode] = useState<'recorder' | 'player'>('recorder');

  const handleStartRecording = () => {
    recorder.startRecording();
  };

  const handleStopRecording = () => {
    recorder.stopRecording();
  };

  const handleSwitchToPlayer = () => {
    recorder.stopRecording();
    setEvents(recorder.getEvents());
    setMode('player');
  };

  if (mode === 'recorder') {
    return (
      <SampleComponent onStartRecording={handleStartRecording} onStopRecording={handleStopRecording} onSwitchToPlayer={handleSwitchToPlayer} />
    );
  } else {
    return (
      <RrwebPlayer emits={events} />
    );
  }
}

export default App
