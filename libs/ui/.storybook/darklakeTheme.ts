import { create } from "@storybook/theming";

export const darklakeTheme = create({
  base: "dark",
  brandTitle: "Darklake Storybook",
  brandUrl: "https://darklake.fi",
  brandImage: "https://darklake.fi/images/logo-h-darklake-beta.svg",
  brandTarget: "_self",

  colorPrimary: "#09351D",
  colorSecondary: "#4A63D2",
  appBg: "#041C0F",
  appContentBg: "#062916",
  appPreviewBg: "#062916",
  appBorderColor: "#35D688",
  appBorderRadius: 4,
  textColor: "#2CFF8E",
  textInverseColor: "#09351D",
  barTextColor: "#1A9A56",
  barSelectedColor: "#1A9A56",
  barHoverColor: "#09351D",
  barBg: "#09351D",
  inputBg: "#09351D",
  inputBorder: "#35D688",
  inputTextColor: "#1A9A56",
  inputBorderRadius: 2,
});
