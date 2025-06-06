import "react";

declare module "react" {
  interface CSSProperties extends React.CSSProperties {
    "--background-image-url"?: string;
  }
}
