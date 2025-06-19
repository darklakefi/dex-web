import { Button, Header, Icon, Text } from "@dex-web/ui";
import { useTranslations } from "next-intl";

export const AppHeader = () => {
  const t = useTranslations("pages");
  return (
    <Header
      button={<Button variant="primary">CONNECT WALLET</Button>}
      logoLg={<Icon className="h-6 w-auto stroke-none" name="logo-lg" />}
      logoSm={<Icon className="h-6 w-auto stroke-none" name="logo-sm" />}
    >
      <Text.Link
        className="inline-flex items-baseline justify-center leading-none no-underline"
        data-testid="home-link"
      >
        {t("home")}
      </Text.Link>
      <Text.Link className="inline-flex items-baseline justify-center leading-none no-underline">
        {t("about")}
      </Text.Link>
      <Text.Link className="inline-flex items-baseline justify-center gap-2 leading-none no-underline">
        {t("contact")} <Icon className="size-4" name="external-link" />
      </Text.Link>
    </Header>
  );
};
