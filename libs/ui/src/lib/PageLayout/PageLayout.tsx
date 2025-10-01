import type { Footer } from "../Footer/Footer";
import type { Header } from "../Header/Header";

export { default as backgroundImage } from "./background.png";

interface PageLayoutProps {
  header: React.ReactElement<typeof Header>;
  children: React.ReactNode;
  footer: React.ReactElement<typeof Footer>;
  backgroundImageUrl: string;
}

/**
 * The PageLayout component is used to ensure a consistent layout for all pages.
 * It is used to display the header, footer, and background image.
 */
export function PageLayout({
  header,
  children,
  footer,
  backgroundImageUrl,
}: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-green-900 text-green-200">
      {header}
      <main
        className={
          "flex-auto bg-[image:var(--background-image-url)] bg-cover bg-top px-5 py-10 lg:px-30 lg:py-20"
        }
        style={
          {
            "--background-image-url": `url(${backgroundImageUrl})`,
          } as React.CSSProperties
        }
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
