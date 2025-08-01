import { backgroundImage, PageLayout } from "@dex-web/ui";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "../lib/orpc.server";
import Providers from "./_components/Providers";
import "./global.css";
import { NextIntlClientProvider } from "next-intl";
import { AppFooter } from "./_components/AppFooter";
import { AppHeader } from "./_components/AppHeader";

const bitsumishiRegular = localFont({
  src: "./_fonts/bitsumishi-regular.woff2",
  style: "normal",
  variable: "--font-bitsumishi-regular",
  weight: "400",
});

const classicConsoleNeue = localFont({
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
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <html
      className={`${bitsumishiRegular.variable} ${classicConsoleNeue.variable} font-sans antialiased`}
      lang={locale}
    >
      <body>
        <NextIntlClientProvider>
          <Providers>
            <Toaster position="top-right" />
            <PageLayout
              backgroundImageUrl={backgroundImage.src}
              footer={<AppFooter />}
              header={<AppHeader />}
            >
              {children}
            </PageLayout>
            {modal}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
