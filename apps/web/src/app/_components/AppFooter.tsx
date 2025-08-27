import { Footer, Icon, type IconName, Text } from "@dex-web/ui";
import Link from "next/link";

const SOCIAL_MEDIA_LINKS = [
  {
    href: process.env.NEXT_PUBLIC_X_URL,
    icon: "x",
    name: "x",
  },
  {
    href: process.env.NEXT_PUBLIC_TELEGRAM_URL,
    icon: "telegram",
    name: "Telegram",
  },
  {
    href: process.env.NEXT_PUBLIC_GITHUB_URL,
    icon: "github",
    name: "Github",
  },
];

export const AppFooter = () => {
  return (
    <Footer
      logo={<Icon className="h-6 w-auto stroke-none" name="logo-lg" />}
      socialMediaLinks={[]}
    >
      <div className="flex max-w-md flex-col items-start gap-2">
        <Text.Body2 className="inline-flex items-baseline justify-center no-underline">
          Darklake is a decentralized, non-custodial protocol. Trading digital
          assets carries high risk, including total loss, smart contract
          vulnerabilities, and extreme volatility. Not available to UK residents
          and not covered by FSCS, FOS, or any investor protection scheme.
        </Text.Body2>
        <Text
          as={Link}
          className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline hover:text-green-200"
          href="https://docs.darklake.fi/legal-disclaimer-and-user-notice"
          target="_blank"
          variant="link"
        >
          [Learn more]
        </Text>
      </div>
      <div className="flex flex-col items-start gap-5">
        {/*
        <Text.Link className="inline-flex items-baseline justify-center leading-none no-underline">
          MEV
        </Text.Link>
        <Text.Link className="inline-flex items-baseline justify-center text-green-300 leading-none no-underline">
          What is MEV?
        </Text.Link>
        */}
        <Text
          as={Link}
          className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline"
          href="https://mev.darklake.fi/"
          target="_blank"
          variant="link"
        >
          MEV Checker{" "}
          <Icon className="size-4 fill-green-300" name="external-link" />
        </Text>
      </div>
      <div className="flex flex-col items-start gap-5">
        <Text.Link className="inline-flex items-baseline justify-center no-underline">
          Resources
        </Text.Link>
        <Text
          as={Link}
          className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline"
          href="https://docs.darklake.fi"
          target="_blank"
          variant="link"
        >
          Docs <Icon className="size-4 fill-green-300" name="external-link" />
        </Text>
        <Text
          as={Link}
          className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline"
          href="https://darklake.typeform.com/contact"
          target="_blank"
          variant="link"
        >
          Support{" "}
          <Icon className="size-4 fill-green-300" name="external-link" />
        </Text>
        <Text
          as={Link}
          className="inline-flex items-baseline justify-center gap-2 text-green-300 no-underline"
          href="https://docs.darklake.fi/cookies-policy"
          target="_blank"
          variant="link"
        >
          Cookies Policy{" "}
          <Icon className="size-4 fill-green-300" name="external-link" />
        </Text>
      </div>
      {SOCIAL_MEDIA_LINKS.some((link) => link.href !== undefined) && (
        <div className="flex items-start gap-10">
          {SOCIAL_MEDIA_LINKS.filter((link) => link.href !== undefined).map(
            (link) => (
              <Text as={Link} href={link.href} key={link.name} target="_blank">
                <Icon
                  className="size-6 cursor-pointer text-green-300 hover:text-green-200"
                  name={link.icon as IconName}
                />
              </Text>
            ),
          )}
        </div>
      )}
    </Footer>
  );
};
