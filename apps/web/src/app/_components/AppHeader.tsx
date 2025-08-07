"use client";
import { Header, Icon, Text } from "@dex-web/ui";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppHeaderButton } from "./AppHeaderButton";

export const AppHeader = () => {
  const tx = useTranslations("pages");
  const pathname = usePathname();
  console.log(pathname);
  return (
    <Header
      button={<AppHeaderButton />}
      logoLg={<Icon className="h-6 w-auto stroke-none" name="logo-lg" />}
      logoSm={<Icon className="h-6 w-auto stroke-none" name="logo-sm" />}
    >
      <Text
        active={pathname === "/"}
        className="inline-flex items-baseline justify-center leading-none no-underline"
        data-testid="home-link"
        href="/"
        variant="link"
      >
        {tx("swap")}
      </Text>
      {/* <Text
        active={pathname === "/liquidity"}
        as={Link}
        className="inline-flex items-baseline justify-center leading-none no-underline"
        data-testid="home-link"
        href="/liquidity"
        variant="link"
      >
        {tx("liquidity")}
      </Text>
      <Text
        active={pathname === "/pools"}
        as={Link}
        className="inline-flex items-baseline justify-center leading-none no-underline"
        data-testid="home-link"
        href="/pools"
        variant="link"
      >
        {tx("pools")}
      </Text> */}
      <Text
        active={pathname === "/about"}
        className="inline-flex items-baseline justify-center leading-none no-underline"
        href="https://docs.darklake.fi"
        variant="link"
      >
        {tx("about")} <Icon className="size-4" name="external-link" />
      </Text>
      <Text
        active={pathname === "/contact"}
        className="inline-flex items-baseline justify-center gap-2 leading-none no-underline"
        href="https://darklake.typeform.com/contact"
        variant="link"
      >
        {tx("contact")} <Icon className="size-4" name="external-link" />
      </Text>
    </Header>
  );
};
