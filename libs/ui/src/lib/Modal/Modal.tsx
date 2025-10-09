"use client";

import { useCallback, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}
/**
 * The Modal component is a modal dialog that can be used to display content in a overlay.
 * Optimized for performance with proper event handling and cleanup.
 */
export function Modal({ children, onClose, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <dialog
      aria-modal="true"
      className={twMerge(
        "fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-black/50",
        className,
      )}
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleBackdropClick(
            e as unknown as React.MouseEvent<HTMLDialogElement>,
          );
        }
      }}
      ref={dialogRef}
    >
      {children}
    </dialog>
  );
}
