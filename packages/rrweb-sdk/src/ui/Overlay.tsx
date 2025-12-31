interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const Overlay = ({ isOpen, onClose }: Props) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: 999999,
        opacity: isOpen ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    />
  );
};
