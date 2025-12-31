import { CSSProperties } from "react";

interface Props {
  isRecording: boolean;
  onClick: () => void;
}

export const FloatingButton = ({ isRecording, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      aria-label="Open RRWeb Settings"
      style={styles.button}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.95)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
      }}
    >
      {/* Camera Icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="white"
        style={{ width: "24px", height: "24px" }}
      >
        <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
        <path
          fillRule="evenodd"
          d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
          clipRule="evenodd"
        />
      </svg>

      {/* Recording Indicator */}
      {isRecording && <div style={styles.recordingIndicator} />}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </button>
  );
};

const styles: Record<string, CSSProperties> = {
  button: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    cursor: "pointer",
    zIndex: 999999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  },
  recordingIndicator: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "12px",
    height: "12px",
    backgroundColor: "#ef4444",
    borderRadius: "50%",
    border: "2px solid white",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },
};
