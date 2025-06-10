import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../Icon/Icon";
import { Text } from "../Text/Text";
import { Footer } from "./Footer";

const meta = {
  component: Footer,
  title: "Footer",
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    children: (
      <>
        <div className="flex flex-col items-start gap-5">
          <Text.Link className="inline-flex items-baseline justify-center leading-none no-underline">
            MEV
          </Text.Link>
          <Text.Link className="inline-flex items-baseline justify-center text-green-300 leading-none no-underline">
            What is MEV?
          </Text.Link>
          <Text.Link className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline">
            MEV Checker{" "}
            <Icon className="size-4 fill-green-300" name="external-link" />
          </Text.Link>
        </div>
        <div className="flex flex-col items-start gap-5">
          <Text.Link className="inline-flex items-baseline justify-center no-underline">
            Resources
          </Text.Link>
          <Text.Link className="inline-flex items-baseline justify-center text-green-300 no-underline">
            Docs
          </Text.Link>
          <Text.Link className="inline-flex items-baseline justify-center text-green-300 no-underline">
            Support
          </Text.Link>
          <Text.Link className="inline-flex items-baseline justify-center text-green-300 no-underline">
            Cookies
          </Text.Link>
        </div>
        <div className="flex flex-col items-start gap-5">
          <Text.Link className="inline-flex items-baseline justify-center no-underline">
            Protocol Stats
          </Text.Link>
          <Text.Link className="inline-flex flex-col items-baseline justify-center text-green-300 no-underline">
            <div>TVL</div>
            <div>$421.23M</div>
          </Text.Link>
          <Text.Link className="inline-flex flex-col items-baseline justify-center text-green-300 no-underline">
            <div>7D Vol</div>
            <div>$21.23M</div>
          </Text.Link>
        </div>
      </>
    ),
    logo: <Icon className="h-6 w-auto stroke-none" name="logo-lg" />,
    socialMediaLinks: (
      <>
        <Icon className="size-6 fill-green-300" name="x" />
        <Icon className="size-6 stroke-green-300" name="telegram" />
        <Icon className="size-6 fill-green-300" name="github" />
      </>
    ),
  },
} satisfies Story;
