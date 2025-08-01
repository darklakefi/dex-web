"use client";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}
/**
 * The Modal component is a modal dialog that can be used to display content in a overlay.
 */
export function Modal({ children, onClose }: ModalProps) {
  return (
    <dialog
      aria-modal="true"
      className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}
