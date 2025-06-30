import { Header, Icon, Text } from "@dex-web/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ConnectWalletButton } from "../(wallet)/_components/ConnectWalletButton";

export function AppHeader() {
  const t = useTranslations("pages");
  return (
    <Header
      button={<ConnectWalletButton />}
      logoLg={
        <Link href="/" passHref>
          <Icon
            className="h-6 w-auto cursor-pointer stroke-none"
            name="logo-lg"
          />
        </Link>
      }
      logoSm={
        <Link href="/" passHref>
          <Icon
            className="h-6 w-auto cursor-pointer stroke-none"
            name="logo-sm"
          />
        </Link>
      }
    >
      <Text.Link className="inline-flex items-baseline justify-center leading-none no-underline">
        <Link href="/" passHref>
          Swap
        </Link>
      </Text.Link>
      <Text.Link className="inline-flex items-baseline justify-center leading-none no-underline">
        <Link href="/about" passHref>
          {t("about")}
        </Link>
      </Text.Link>
      <Text.Link className="inline-flex items-baseline justify-center gap-2 leading-none no-underline">
        Contact <Icon className="size-4" name="external-link" />
      </Text.Link>
    </Header>
  );
}
