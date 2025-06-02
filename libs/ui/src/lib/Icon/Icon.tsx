import { twMerge } from "tailwind-merge";

import AnalyticsIcon from "./icons/analytics.svg?react";
import CheckboxEmptyIcon from "./icons/checkbox-empty.svg?react";
import CheckboxFilledIcon from "./icons/checkbox-filled.svg?react";
import ChevronDownIcon from "./icons/chevron-down.svg?react";
import ExternalLinkIcon from "./icons/external-link.svg?react";
import GithubIcon from "./icons/github.svg?react";
import InfoIcon from "./icons/info.svg?react";
import LoadingStripeIcon from "./icons/loading-stripe.svg?react";
import LogoIcon from "./icons/logo.svg?react";
import PlayIcon from "./icons/play.svg?react";
import SeedlingsIcon from "./icons/seedlings.svg?react";
import TimesFilledIcon from "./icons/times-filled.svg?react";
import TimesIcon from "./icons/times.svg?react";
import TrendingIcon from "./icons/trending.svg?react";
import XIcon from "./icons/x.svg?react";

export type IconName =
  | "analytics"
  | "checkbox-empty"
  | "checkbox-filled"
  | "chevron-down"
  | "external-link"
  | "github"
  | "info"
  | "logo"
  | "play"
  | "seedlings"
  | "times"
  | "times-filled"
  | "trending"
  | "loading-stripe"
  | "x";

const iconComponents = {
  analytics: AnalyticsIcon,
  "checkbox-empty": CheckboxEmptyIcon,
  "checkbox-filled": CheckboxFilledIcon,
  "chevron-down": ChevronDownIcon,
  "external-link": ExternalLinkIcon,
  github: GithubIcon,
  info: InfoIcon,
  logo: LogoIcon,
  play: PlayIcon,
  seedlings: SeedlingsIcon,
  times: TimesIcon,
  "times-filled": TimesFilledIcon,
  trending: TrendingIcon,
  "loading-stripe": LoadingStripeIcon,
  x: XIcon,
} as const satisfies Record<
  IconName,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
>;

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  title?: string;
}

/**
 * The Icon component is a wrapper for the SVG icons.
 * It is used to display the SVG icons in the application.
 * This is a server component that supports tree shaking.
 */
export function Icon({ name, title, className, ...props }: IconProps) {
  const IconComponent = iconComponents[name];
  if (!IconComponent) return null;

  const classNames = twMerge("size-6 text-green-100 fill-current", className);

  return <IconComponent className={classNames} {...props} />;
}
