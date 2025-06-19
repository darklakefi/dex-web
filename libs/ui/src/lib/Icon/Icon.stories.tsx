import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "./Icon";

const meta = {
  component: Icon,
  title: "Icon",
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Analytics = {
  args: {
    name: "analytics",
    title: "Analytics",
  },
} satisfies Story;

export const ChevronDown = {
  args: {
    name: "chevron-down",
    title: "Chevron Down",
  },
} satisfies Story;

export const ExternalLink = {
  args: {
    name: "external-link",
    title: "External Link",
  },
} satisfies Story;

export const Github = {
  args: {
    name: "github",
    title: "Github",
  },
} satisfies Story;

export const Info = {
  args: {
    name: "info",
    title: "Info",
  },
} satisfies Story;

export const Play = {
  args: {
    name: "play",
    title: "Play",
  },
} satisfies Story;

export const Seedlings = {
  args: {
    name: "seedlings",
    title: "Seedlings",
  },
} satisfies Story;

export const Times = {
  args: {
    name: "times",
    title: "Times",
  },
} satisfies Story;

export const TimesFilled = {
  args: {
    name: "times-filled",
    title: "Times Filled",
  },
} satisfies Story;

export const Trending = {
  args: {
    name: "trending",
    title: "Trending",
  },
} satisfies Story;

export const X = {
  args: {
    name: "x",
    title: "X",
  },
} satisfies Story;

export const Refresh = {
  args: {
    name: "refresh",
    title: "Refresh",
  },
} satisfies Story;

export const Cog = {
  args: {
    name: "cog",
    title: "Cog",
  },
} satisfies Story;
