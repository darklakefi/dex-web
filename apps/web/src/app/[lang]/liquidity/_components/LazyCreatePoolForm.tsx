"use client";

import dynamic from "next/dynamic";
import { Box } from "@dex-web/ui";
import { SkeletonLoader } from "../../../_components/SkeletonLoader";

const CreatePoolForm = dynamic(
  () =>
    import("./CreatePoolForm").then((mod) => ({
      default: mod.CreatePoolForm,
    })),
  {
    loading: () => (
      <Box className="w-full max-w-md animate-pulse">
        <SkeletonLoader className="mb-4 h-8 w-48" variant="text" />
        <div className="space-y-4">
          <SkeletonLoader className="h-20 w-full" variant="input" />
          <SkeletonLoader className="h-20 w-full" variant="input" />
          <SkeletonLoader className="h-16 w-full" variant="input" />
          <SkeletonLoader className="h-12 w-full" variant="button" />
        </div>
      </Box>
    ),
    ssr: false,
  },
);

export { CreatePoolForm as LazyCreatePoolForm };