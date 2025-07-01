{ pkgs, inputs, ... }:

let
  pkgs-unstable = import inputs.nixpkgs-unstable { system = pkgs.stdenv.system; };
in
{
  languages.javascript = {
    enable = true;
    package = pkgs-unstable.nodejs_24;
    pnpm.enable = true;
  };

  languages.typescript.enable = true;

  enterShell = ''
    node --version
    pnpm --version
    tsc --version
  '';

  cachix.enable = false;
  dotenv.enable = true;
}
