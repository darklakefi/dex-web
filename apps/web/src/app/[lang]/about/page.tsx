import { Text } from "@dex-web/ui";
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("pages");
  return (
    <div className="flex items-center justify-center">
      <Text.Heading>{t("about")}</Text.Heading>
    </div>
  );
}
