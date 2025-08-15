import { Suspense } from "react";
import { SelectWalletModal } from "../../../_components/SelectWalletModal";

export default async function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SelectWalletModal />
    </Suspense>
  );
}
