"use client";

import { Button, Header, Icon, Text } from "@dex-web/ui";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Link, usePathname } from "../../i18n/navigation";
import { WalletButton } from "./WalletButton";

const BetaLogo = () => {
  return (
    <div className="relative h-6 w-50">
      <Image
        alt="Beta Logo"
        className="h-auto w-full object-fill"
        fill
        sizes="200px"
        src="/images/logo-beta.svg"
      />
    </div>
  );
};

export const AppHeader = () => {
  const tx = useTranslations("pages");
  const pathname = usePathname();

  return (
    <Header
      button={
        <Suspense
          fallback={
            <Button loading variant="secondary">
              Loading...
            </Button>
          }
        >
          <WalletButton suppressHydrationWarning={true} />
        </Suspense>
      }
      logoLg={<BetaLogo />}
      logoSm={<BetaLogo />}
    >
      <Link
        className={`inline-flex items-baseline justify-center leading-none ${pathname === "/" ? "text-green-100" : "text-green-300"}`}
        data-testid="home-link"
        href="/"
      >
        <Text className="no-underline" variant="link">
          {tx("swap")}
        </Text>
      </Link>
      <Link
        className={`inline-flex items-baseline justify-center leading-none ${pathname === "/liquidity" ? "text-green-100" : "text-green-300"}`}
        data-testid="liquidity-link"
        href="/liquidity"
      >
        <Text className="no-underline" variant="link">
          {tx("liquidity")}
        </Text>
      </Link>
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
