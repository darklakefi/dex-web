declare module "*.svg" {
  import type React from "react";
  const ReactComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
  export { ReactComponent };
}
