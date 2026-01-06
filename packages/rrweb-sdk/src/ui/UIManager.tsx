import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FloatingButton } from "./FloatingButton";
import { SettingsPanel } from "./SettingsPanel";
import type { RecordingState } from "../types";

interface Props {
  getState: () => RecordingState;
  onUploadRrwebEvents: (projectKey: string) => void;
}

export const UIManager = ({ getState, onUploadRrwebEvents }: Props) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [state, setState] = useState<RecordingState>(getState());

  // Update state every second
  useEffect(() => {
    const interval = setInterval(() => {
      setState(getState());
    }, 1000);

    return () => clearInterval(interval);
  }, [getState]);

  const openPanel = () => {
    setState(getState()); // Refresh state when opening
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  return createPortal(
    <>
      <FloatingButton isRecording={state.isRecording} onClick={openPanel} />
      <SettingsPanel
        isOpen={isPanelOpen}
        state={state}
        onClose={closePanel}
        onManualUpload={onUploadRrwebEvents}
      />
    </>,
    document.body
  );
};
