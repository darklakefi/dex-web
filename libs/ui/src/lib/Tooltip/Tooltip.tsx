"use client";

import type React from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { twMerge } from "tailwind-merge";

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  place?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({
  id: tooltipId,
  children,
  place = "top",
  className,
  ...props
}: React.PropsWithChildren<TooltipProps>) {
  return (
    <ReactTooltip
      className={twMerge(
        "bg-green-800 p-4 text-green-300 opacity-100! shadow-green-900 shadow-sm",
        className,
      )}
      disableStyleInjection
      id={tooltipId}
      noArrow
      place={place}
      wrapper="div"
      {...props}
    >
      {children}
    </ReactTooltip>
  );
}
