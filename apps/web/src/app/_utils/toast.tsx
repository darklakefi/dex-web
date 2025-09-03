import { Toast as UIToast } from "@dex-web/ui";
import { toast as sonnerToast } from "sonner";

interface ToastProps {
  id: string | number;
  title: string;
  description: string | React.ReactNode;
  variant?: "success" | "error" | "warning" | "info" | "loading";
  customAction?: React.ReactNode;
}

export function toast(toast: Omit<ToastProps, "id">) {
  let duration = 5000;
  if (toast.variant === "error") {
    duration = Infinity;
  }
  return sonnerToast.custom(
    (id) => (
      <Toast
        customAction={toast.customAction}
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
  const { title, description, id, variant, customAction = null } = props;

  return (
    <UIToast
      customAction={customAction}
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
