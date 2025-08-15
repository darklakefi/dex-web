"use client";
import { Header, Icon, Text } from "@dex-web/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppHeaderButton } from "./AppHeaderButton";

export const AppHeader = () => {
  const tx = useTranslations("pages");
  const pathname = usePathname();
  return (
    <Header
      button={<AppHeaderButton />}
      logoLg={<Icon className="h-6 w-auto stroke-none" name="logo-lg" />}
      logoSm={<Icon className="h-6 w-auto stroke-none" name="logo-sm" />}
    >
      <Text
        as={Link}
        className={`inline-flex items-baseline justify-center leading-none no-underline ${pathname === "/" ? "text-green-100" : "text-green-300"}`}
        data-testid="home-link"
        href="/"
        variant="link"
      >
        {tx("swap")}
      </Text>
      <Text
        as={Link}
        className={`inline-flex items-baseline justify-center leading-none no-underline ${pathname === "/liquidity" ? "text-green-100" : "text-green-300"}`}
        data-testid="liquidity-link"
        href="/liquidity"
        variant="link"
      >
        {tx("liquidity")}
      </Text>
      <Text
        as={Link}
        className="inline-flex items-baseline justify-center gap-2 text-green-300 leading-none no-underline"
        href="https://docs.darklake.fi"
        target="_blank"
        variant="link"
      >
        {tx("about")} <Icon className="size-4" name="external-link" />
      </Text>
      <Text
        as={Link}
        className="inline-flex items-baseline justify-center gap-2 text-green-300 leading-none no-underline"
        href="https://darklake.typeform.com/contact"
        target="_blank"
        variant="link"
      >
        {tx("contact")} <Icon className="size-4" name="external-link" />
      </Text>
    </Header>
  );
};
