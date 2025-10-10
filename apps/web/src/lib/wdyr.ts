/// <reference types="@welldone-software/why-did-you-render" />
import React from "react";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    trackExtraHooks: [
      [require("@tanstack/react-query"), "useQuery"],
      [require("@tanstack/react-query"), "useSuspenseQuery"],
      [require("@tanstack/react-query"), "useInfiniteQuery"],
    ],
    logOnDifferentValues: true,
    collapseGroups: true,
  });
}
