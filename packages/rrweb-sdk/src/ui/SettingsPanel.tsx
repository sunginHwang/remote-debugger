import React, { useState } from "react";
import type { RecordingState } from "../types";
import { Overlay } from "./Overlay";

interface Props {
  isOpen: boolean;
  state: RecordingState;
  onClose: () => void;
  onManualUpload: () => void;
}

export const SettingsPanel = ({
  isOpen,
  state,
  onClose,
  onManualUpload,
}: Props) => {
  const [copied, setCopied] = useState(false);

  const copySessionId = async () => {
    if (!state.sessionId || state.sessionId === "-") return;

    try {
      await navigator.clipboard.writeText(state.sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[RRWeb SDK] Failed to copy session ID:", error);
    }
  };

  const handleUpload = () => {
    onManualUpload();
    onClose();
  };

  const durationSeconds = Math.floor(state.durationMs / 1000);

  return (
    <>
      <Overlay isOpen={isOpen} onClose={onClose} />
      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "360px",
          height: "100%",
          background: "white",
          boxShadow: "-4px 0 12px rgba(0, 0, 0, 0.1)",
          zIndex: 1000000,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
            RRWeb Recording
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              padding: 0,
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          {/* Status */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Status
            </div>
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 600,
                background: state.isRecording ? "#fee2e2" : "#e5e7eb",
                color: state.isRecording ? "#dc2626" : "#6b7280",
              }}
            >
              {state.isRecording ? "Recording" : "Idle"}
            </span>
          </div>

          {/* Session ID */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Session ID
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#1f2937",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {state.sessionId || "-"}
              </div>
              <button
                onClick={copySessionId}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#4b5563",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e5e7eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Event Count */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Event Count
            </div>
            <div
              style={{ fontSize: "14px", color: "#1f2937", fontWeight: 500 }}
            >
              {state.eventCount}
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Duration
            </div>
            <div
              style={{ fontSize: "14px", color: "#1f2937", fontWeight: 500 }}
            >
              {durationSeconds}s
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={state.eventCount === 0}
            style={{
              width: "100%",
              padding: "12px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: state.eventCount === 0 ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
              marginTop: "12px",
              opacity: state.eventCount === 0 ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (state.eventCount > 0) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity =
                state.eventCount === 0 ? "0.5" : "1";
            }}
          >
            Upload Now
          </button>
        </div>
      </div>

      <style>
        {`
          @media (max-width: 480px) {
            .rrweb-settings-panel {
              width: 100%;
            }
          }
        `}
      </style>
    </>
  );
};
