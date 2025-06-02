interface HeaderProps {
  logo: React.ReactNode;
  children: React.ReactNode;
  button: React.ReactNode;
}
export function Header({ children, logo, button }: HeaderProps) {
  return (
    <header className="`flex-row flex items-center justify-between bg-green-900 p-10">
      <div>{logo}</div>
      <nav className="flex items-center gap-12">{children}</nav>
      <div>{button}</div>
    </header>
  );
}
