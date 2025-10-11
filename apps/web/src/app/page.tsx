import { redirect } from "next/navigation";

export default function Page() {
  // Default to English without i18n middleware.
  redirect("/en");
}

