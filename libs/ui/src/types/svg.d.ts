declare module "*.svg" {
  import type React from "react";
  export const ReactComponent: React.ComponentType<
    React.SVGProps<SVGSVGElement>
  >;
  export default ReactComponent;
}
