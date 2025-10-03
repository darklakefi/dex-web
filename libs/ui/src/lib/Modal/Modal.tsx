"use client";

import { twMerge } from "tailwind-merge";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}
/**
 * The Modal component is a modal dialog that can be used to display content in a overlay.
 */
export function Modal({ children, onClose, className }: ModalProps) {
  return (
    <dialog
      aria-modal="true"
      className={twMerge(
        "fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-black/50",
        className,
      )}
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
