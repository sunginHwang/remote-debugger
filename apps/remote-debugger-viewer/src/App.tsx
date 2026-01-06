import { useState, useEffect } from "react";
import "./App.css";
import { SampleComponent } from "./components/sample-component/SampleComponent";
import { RrwebPlayer } from "./rrweb-player/RrwebPlayer";
import { useRRWebRecorder } from "./rrweb-recoder/hooks/useRRWebRecorder";
import type { eventWithTime } from "@rrweb/types";
import { ReplayRrweb } from "./components/replay-rrweb/ReplayRrweb";

function App() {
  const recorder = useRRWebRecorder();
  const [events, setEvents] = useState<eventWithTime[]>([]);
  const [mode, setMode] = useState<"recorder" | "player" | "replay">(
    "recorder"
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get("eventId");
    if (eventId) {
      setMode("replay");
    }
  }, []);

  const handleStartRecording = () => {
    recorder.startRecording();
  };

  const handleStopRecording = () => {
    recorder.stopRecording();
  };

  const handleSwitchToPlayer = () => {
    recorder.stopRecording();
    setEvents(recorder.getEvents());
    setMode("player");
  };

  if (mode === "replay") {
    return <ReplayRrweb />;
  }

  if (mode === "recorder") {
    return (
      <SampleComponent
        events={events}
        onRunReplay={() => {
          setMode("replay");
        }}
        onSaveEventsToState={() => {
          recorder.stopRecording();
          setEvents(recorder.getEvents());
        }}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onSwitchToPlayer={handleSwitchToPlayer}
      />
    );
  } else {
    return <RrwebPlayer emits={events} />;
  }
}

export default App;
