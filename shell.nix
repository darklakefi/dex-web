{ pkgs ? import <nixpkgs> { } }:

let nodejs = pkgs.nodejs_22;
in pkgs.mkShell {
  packages = [ nodejs pkgs.nodePackages.pnpm pkgs.nodePackages.typescript ];
}
