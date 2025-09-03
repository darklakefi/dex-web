interface HeaderProps {
  logoSm: React.ReactNode;
  logoLg: React.ReactNode;
  children: React.ReactNode;
  button: React.ReactNode;
}

/**
 * The Header component is a wrapper for the header of the application.
 */
export function Header({ children, logoSm, logoLg, button }: HeaderProps) {
  return (
    <header className="`flex-row flex flex-none items-center justify-between gap-10 bg-green-900 p-5 md:px-6 md:py-7 xl:px-10">
      <div className="md:hidden">{logoSm}</div>
      <div className="hidden md:block">{logoLg}</div>
      <nav className="hidden items-baseline gap-12 md:flex">{children}</nav>
      <div className="hidden md:block">{button}</div>
    </header>
  );
}
