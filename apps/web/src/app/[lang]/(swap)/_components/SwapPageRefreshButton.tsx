import { Icon } from "@dex-web/ui";

export function SwapPageRefreshButton({
  onClick,
  isLoading,
}: {
  onClick: () => void;
  isLoading?: boolean;
}) {
  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    onClick();
  }

  return (
    <button
      aria-label="refresh"
      className="inline-flex cursor-pointer items-center justify-center bg-green-800 p-2 text-green-300 hover:text-green-200 focus:text-green-200"
      onClick={handleClick}
      type="button"
    >
      <Icon
        className={`size-5 ${isLoading ? "animate-spin-pause" : ""}`}
        name="refresh"
      />
    </button>
  );
}
