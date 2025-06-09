import { twMerge } from "tailwind-merge";

import AnalyticsIcon from "./icons/analytics.svg";
import CheckboxEmptyIcon from "./icons/checkbox-empty.svg";
import CheckboxFilledIcon from "./icons/checkbox-filled.svg";
import ChevronDownIcon from "./icons/chevron-down.svg";
import CrownIcon from "./icons/crown.svg";
import ExternalLinkIcon from "./icons/external-link.svg";
import FireIcon from "./icons/fire.svg";
import GithubIcon from "./icons/github.svg";
import InfoIcon from "./icons/info.svg";
import LoadingStripeIcon from "./icons/loading-stripe.svg";
import LogoLgIcon from "./icons/logo-lg.svg";
import LogoSmIcon from "./icons/logo-sm.svg";
import PlayIcon from "./icons/play.svg";
import SeedlingsIcon from "./icons/seedlings.svg";
import TelegramIcon from "./icons/telegram.svg";
import TimesFilledIcon from "./icons/times-filled.svg";
import TimesIcon from "./icons/times.svg";
import TrendingIcon from "./icons/trending.svg";
import XIcon from "./icons/x.svg";

export type IconName =
  | "analytics"
  | "checkbox-empty"
  | "checkbox-filled"
  | "chevron-down"
  | "crown"
  | "external-link"
  | "fire"
  | "github"
  | "info"
  | "logo-sm"
  | "logo-lg"
  | "play"
  | "seedlings"
  | "telegram"
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
  "logo-sm": LogoSmIcon,
  "logo-lg": LogoLgIcon,
  play: PlayIcon,
  seedlings: SeedlingsIcon,
  telegram: TelegramIcon,
  times: TimesIcon,
  "times-filled": TimesFilledIcon,
  trending: TrendingIcon,
  "loading-stripe": LoadingStripeIcon,
  x: XIcon,
  crown: CrownIcon,
  fire: FireIcon,
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
