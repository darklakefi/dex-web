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
  | "x";

import { Suspense, lazy } from "react";
import { twMerge } from "tailwind-merge";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  title?: string;
}

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
