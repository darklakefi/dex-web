declare module "*.svg" {
  import type React from "react";
  const ReactComponent: React.ComponentType<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default ReactComponent;
}

declare module "*.svg?react" {
  import type React from "react";
  const ReactComponent: React.ComponentType<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default ReactComponent;
}

declare module "*.svg?url" {
  const content: string;
  export default content;
}
