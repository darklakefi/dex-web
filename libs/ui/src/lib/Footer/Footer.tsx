interface FooterProps {
  logo: React.ReactNode;
  children: React.ReactNode;
  socialMediaLinks: React.ReactNode;
}

/**
 * The Footer component is a wrapper for the footer of the application.
 * It is used to display the footer of the application.
 */
export function Footer({ children, logo, socialMediaLinks }: FooterProps) {
  return (
    <footer className="flex min-h-60 flex-col items-start justify-between gap-20 bg-green-900 px-5 py-10 md:px-6 lg:flex-row xl:px-10">
      <div className="flex-1">{logo}</div>
      <nav className="flex w-full flex-auto flex-col items-baseline justify-between gap-12 md:flex-row lg:w-auto">
        {children}
      </nav>
      <div className="flex max-w-full flex-1 items-center justify-end gap-10">
        {socialMediaLinks}
      </div>
    </footer>
  );
}
