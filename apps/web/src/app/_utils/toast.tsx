import { Toast as UIToast } from "@dex-web/ui";
import { toast as sonnerToast } from "sonner";

interface ToastProps {
  id: string | number;
  title: string;
  description: string;
  variant?: "success" | "error" | "warning" | "info" | "loading";
}

export function toast(toast: Omit<ToastProps, "id">) {
  let duration: number | undefined;
  if (toast.variant === "error") {
    duration = Infinity;
  }
  return sonnerToast.custom(
    (id) => (
      <Toast
        description={toast.description}
        id={id}
        title={toast.title}
        variant={toast.variant || "success"}
      />
    ),
    {
      duration,
    },
  );
}

function Toast(props: ToastProps) {
  const { title, description, id, variant } = props;

  return (
    <UIToast
      description={description}
      onClose={() => {
        sonnerToast.dismiss(id);
      }}
      title={title}
      variant={variant}
    />
  );
}

export const dismissToast = sonnerToast.dismiss;
