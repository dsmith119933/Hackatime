{
  description = "Hakatime";

  inputs = {
    nixpkgs.url =
      "github:nixos/nixpkgs/72cdc142b93cffbedc91001ae5c6e9059b03c60c";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      formatter.${system} = pkgs.nixfmt;

      packages.${system}.default =
        pkgs.haskellPackages.callPackage ./default.nix { };

      devShells.${system}.default =
        pkgs.callPackage ./shell.nix { inherit pkgs; };

      apps.${system}.default = {
        type = "app";
        program = "${self.packages.${system}.default}/bin/hakatime";
      };
    };
}
