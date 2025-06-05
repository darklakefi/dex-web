import type { Footer } from "../Footer/Footer";
import type { Header } from "../Header/Header";
import backgroundImageUrl from "./background.png";
interface PageLayoutProps {
  header: React.ReactElement<typeof Header>;
  children: React.ReactNode;
  footer: React.ReactElement<typeof Footer>;
}

/**
 * The PageLayout component is used to ensure a consistent layout for all pages.
 */
export function PageLayout({ header, children, footer }: PageLayoutProps) {
  return (
    <div className="flex flex-col bg-green-900 text-green-200">
      {header}
      <main
        style={{
          "--background-image-url": `url(${backgroundImageUrl})`,
        }}
        className={
          "bg-[image:var(--background-image-url)] bg-center bg-cover px-5 py-10 lg:px-30 lg:py-20"
        }
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
