import { twMerge } from "tailwind-merge";

import AnalyticsIcon from "./icons/analytics.svg";
import BackpackWalletIcon from "./icons/backpack-icon.svg";
import CheckFilledIcon from "./icons/check-circle-solid.svg";
import ChevronDownIcon from "./icons/chevron-down.svg";
import CogIcon from "./icons/cog.svg";
import CrownIcon from "./icons/crown.svg";
import ExclamationIcon from "./icons/exclamation.svg";
import ExternalLinkIcon from "./icons/external-link.svg";
import FireIcon from "./icons/fire.svg";
import GithubIcon from "./icons/github.svg";
import InfoIcon from "./icons/info.svg";
import InfoFilledIcon from "./icons/info-circle-solid.svg";
import LoadingStripeIcon from "./icons/loading-stripe.svg";
import LogoLgIcon from "./icons/logo-lg.svg";
import LogoSmIcon from "./icons/logo-sm.svg";
import LogoutIcon from "./icons/logout.svg";
import PhantomWalletIcon from "./icons/phantom-icon.svg";
import PlayIcon from "./icons/play.svg";
import PlusIcon from "./icons/plus.svg";
import PlusCircleIcon from "./icons/plus-circle.svg";
import RefreshIcon from "./icons/refresh.svg";
import SearchIcon from "./icons/search.svg";
import SeedlingsIcon from "./icons/seedlings.svg";
import ShareIcon from "./icons/share.svg";
import SolflareWalletIcon from "./icons/solflare-icon.svg";
import SwapIcon from "./icons/swap.svg";
import TelegramIcon from "./icons/telegram.svg";
import TimesIcon from "./icons/times.svg";
import TimesFilledIcon from "./icons/times-filled.svg";
import TrendingIcon from "./icons/trending.svg";
import XIcon from "./icons/x.svg";
export type IconName =
  | "analytics"
  | "backpack"
  | "check-filled"
  | "chevron-down"
  | "cog"
  | "crown"
  | "exclamation"
  | "external-link"
  | "fire"
  | "github"
  | "info-filled"
  | "info"
  | "logout"
  | "loading-stripe"
  | "logo-lg"
  | "logo-sm"
  | "phantom"
  | "play"
  | "plus-circle"
  | "plus"
  | "refresh"
  | "search"
  | "seedlings"
  | "share"
  | "solflare"
  | "swap"
  | "telegram"
  | "times-filled"
  | "times"
  | "trending"
  | "x";

const iconComponents = {
  "check-filled": CheckFilledIcon,
  "chevron-down": ChevronDownIcon,
  "external-link": ExternalLinkIcon,
  "info-filled": InfoFilledIcon,
  "loading-stripe": LoadingStripeIcon,
  "logo-lg": LogoLgIcon,
  "logo-sm": LogoSmIcon,
  "plus-circle": PlusCircleIcon,
  "times-filled": TimesFilledIcon,
  analytics: AnalyticsIcon,
  backpack: BackpackWalletIcon,
  cog: CogIcon,
  crown: CrownIcon,
  exclamation: ExclamationIcon,
  fire: FireIcon,
  github: GithubIcon,
  info: InfoIcon,
  logout: LogoutIcon,
  phantom: PhantomWalletIcon,
  play: PlayIcon,
  plus: PlusIcon,
  refresh: RefreshIcon,
  search: SearchIcon,
  seedlings: SeedlingsIcon,
  share: ShareIcon,
  solflare: SolflareWalletIcon,
  swap: SwapIcon,
  telegram: TelegramIcon,
  times: TimesIcon,
  trending: TrendingIcon,
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

  const classNames = twMerge("size-6 text-current fill-current", className);

  return <IconComponent className={classNames} role="img" {...props} />;
}
