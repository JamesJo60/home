import { ReactNode } from "react";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
        <button className="btn small modal-close" onClick={onClose}>
          ✕
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
