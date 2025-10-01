declare module "*.svg" {
  import type React from "react";
  const ReactComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module "*.svg?react" {
  import type React from "react";
  const ReactComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
