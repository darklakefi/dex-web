"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

export function Modal({ children, onClose, className }: ModalProps) {
  return (
    <Dialog className="relative z-50" onClose={onClose} open={true}>
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex h-full w-full items-center justify-center">
        <DialogPanel
          className={twMerge(
            "flex h-full max-h-full w-full max-w-sm items-center justify-center",
            className,
          )}
        >
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
