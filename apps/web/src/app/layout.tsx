import "../lib/wdyr";
import { Box, backgroundImage, PageLayout, Text } from "@dex-web/ui";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "../lib/orpc.server";
import Providers from "./_components/Providers";
import "./global.css";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../locale/en.json";
import { AppFooter } from "./_components/AppFooter";
import { AppHeader } from "./_components/AppHeader";
import { GeolocationAwareDisclaimerProvider } from "./_components/GeolocationAware";
import { ReferralCodeProvider } from "./_components/ReferralCodeProvider";

const bitsumishiRegular = localFont({
  display: "swap",
  preload: true,
  src: "./_fonts/bitsumishi-regular.woff2",
  style: "normal",
  variable: "--font-bitsumishi-regular",
  weight: "400",
});

const classicConsoleNeue = localFont({
  display: "swap",
  preload: true,
  src: "./_fonts/classic-console-neue.woff2",
  style: "normal",
  variable: "--font-classic-console-neue",
  weight: "400",
});

export const metadata = {
  description:
    "Darklake is the best solana dex for trade execution that is fair, and value for LPs. Learn more about how we use zk to protect your alpha and create fair markets",
  title: "Best Solana Dex for Trade Execution | Darklake",
};

export default async function RootLayout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "en";

  return (
    <html
      className={`${bitsumishiRegular.variable} ${classicConsoleNeue.variable} font-sans antialiased`}
      lang={"en"}
    >
      <body className="bg-green-900">
        <NextIntlClientProvider locale={"en"} messages={enMessages as Record<string, unknown>}>
          <Providers>
            <ReferralCodeProvider>
              <GeolocationAwareDisclaimerProvider />
              <Toaster expand={true} position="top-right" visibleToasts={5} />
              <PageLayout
                backgroundImageUrl={
                  (backgroundImage as unknown as { src: string }).src
                }
                footer={<AppFooter />}
                header={<AppHeader />}
              >
                <Box className="flex w-full flex-col items-center justify-center gap-5 px-5 py-10 text-center md:hidden">
                  <Text.Heading className="text-3xl text-green-300">
                    Thanks for joining our early access!
                  </Text.Heading>
                  <div className="flex flex-col">
                    <Text.Body2 className="text-green-300 text-lg">
                      We're optimizing mobile and it's coming soon.In the
                      meantime,
                    </Text.Body2>
                    <Text.Body2 className="text-green-200 text-lg">
                      please visit us on desktop.
                    </Text.Body2>
                  </div>
                </Box>
                <div className="hidden md:block">{children}</div>
              </PageLayout>
              {modal}
            </ReferralCodeProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
