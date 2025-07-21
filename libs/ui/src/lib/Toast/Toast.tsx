import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { Button } from "../Button/Button";
import { Icon, type IconName } from "../Icon/Icon";
import { Text } from "../Text/Text";

const toastVariants = cva(["flex flex-col gap-2 p-4", "w-xs shadow-sm"], {
  defaultVariants: {
    variant: "success",
  },
  variants: {
    variant: {
      error: "bg-red-950 shadow-red-900",
      info: "bg-blue-950 shadow-[#1E2024]",
      loading: "bg-blue-950 shadow-[#1E2024]",
      success: "bg-green-800 shadow-green-600",
      warning: "bg-yellow-950 shadow-yellow-900",
    },
  },
});

type ToastVariants = VariantProps<typeof toastVariants>;

interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    ToastVariants {
  title: string;
  description: string;
  onClose: () => void;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}

const IconMap = {
  error: "exclamation",
  info: "info-filled",
  loading: "loading-stripe",
  success: "check-filled",
  warning: "exclamation",
};

const iconColorVariants = cva([], {
  defaultVariants: {
    variant: "success",
  },
  variants: {
    variant: {
      error: "text-red-300",
      info: "text-blue-300",
      loading: "text-white",
      success: "text-green-200",
      warning: "text-yellow-300",
    },
  },
});

/**
 * The Box component is a generic container for grouping other components.
 */
export function Toast({
  variant = "success",
  className,
  title,
  description,
  onClose,
  actions,
  ...props
}: ToastProps) {
  return (
    <div className={twMerge(toastVariants({ variant }), className)} {...props}>
      <div className="flex w-full items-center gap-4">
        <Icon
          className={twMerge(
            iconColorVariants({ variant }),
            "size-5",
            variant === "loading" ? "animate-spin-pause" : "",
          )}
          name={IconMap[variant || "success"] as IconName}
        />
        <Text.Body2 className="flex-1 text-white">{title}</Text.Body2>
        <Icon
          className="ml-auto size-4 cursor-pointer text-white"
          name="times"
          onClick={onClose}
        />
      </div>
      <div className="flex flex-col gap-4 pr-6 pl-9">
        <Text.Body3 className="text-white">{description}</Text.Body3>
        {actions && (
          <div className="flex gap-2">
            {actions.map((action) => (
              <Button
                className={twMerge(
                  iconColorVariants({ variant }),
                  "cursor-pointer p-0 underline",
                )}
                key={action.label}
                onClick={action.onClick}
                variant="tertiary"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
