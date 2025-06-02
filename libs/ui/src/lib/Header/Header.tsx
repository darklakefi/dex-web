interface HeaderProps {
  logoSm: React.ReactNode;
  logoLg: React.ReactNode;
  children: React.ReactNode;
  button: React.ReactNode;
}
export function Header({ children, logoSm, logoLg, button }: HeaderProps) {
  return (
    <header className="`flex-row flex items-center justify-between bg-green-900 p-10">
      <div className="md:hidden">{logoSm}</div>
      <div className="hidden md:block">{logoLg}</div>

      <nav className="flex items-baseline gap-12">{children}</nav>
      <div>{button}</div>
    </header>
  );
}
