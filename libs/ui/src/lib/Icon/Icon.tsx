export type IconName =
  | "analytics"
  | "checkbox-empty"
  | "checkbox-filled"
  | "chevron-down"
  | "external-link"
  | "github"
  | "info"
  | "play"
  | "seedlings"
  | "times"
  | "times-filled"
  | "trending"
  | "loading-stripe"
  | "x";

import { Suspense, lazy } from "react";
import { twMerge } from "tailwind-merge";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  title?: string;
}
/**
 * The Icon component is a wrapper for the SVG icons.
 * It is used to display the SVG icons in the application.
 */
export function Icon({ name, title, className, ...props }: IconProps) {
  const IconSvgComponent = lazy(() => import(`./icons/${name}.svg?react`));
  if (!IconSvgComponent) return null;
  const classNames = twMerge(
    "size-6 text-green-100 fill-current stroke-current",
    className,
  );
  return (
    <Suspense fallback={<div className={classNames} />}>
      <IconSvgComponent className={classNames} {...props} />
    </Suspense>
  );
}
