import { Suspense } from "react";
import { ReferralsModal } from "../../../_components/ReferralsModal";

export default async function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReferralsModal />
    </Suspense>
  );
}
