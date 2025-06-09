import { type VariantProps, cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

import { Icon, type IconName } from "../Icon/Icon";
import { Text } from "../Text/Text";

export enum ButtonVariantEnum {
  Primary = "primary",
  PrimaryDark = "primary-dark",
  Secondary = "secondary",
  Tertiary = "tertiary",
}

const buttonVariants = cva(
  "outline-offset-1 focus:outline-2 focus:outline-solid",
  {
    variants: {
      variant: {
        primary:
          "bg-green-100 px-3 py-1.5 text-green-700 hover:bg-green-200 focus:outline-white",
        "primary-dark":
          "bg-green-700 px-3 py-1.5 text-green-100 hover:bg-green-600 focus:outline-white",
        secondary:
          "bg-green-500 px-3 py-1.5 text-green-200 hover:text-green-100 focus:text-green-100 focus:outline-white",
        tertiary:
          "px-1.5 text-green-300 hover:text-green-200 focus:text-green-200 focus:outline-white",
      },
      disabled: {
        true: "cursor-not-allowed opacity-50",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      disabled: false,
    },
  },
);

type ButtonPropsVariantProps = VariantProps<typeof buttonVariants>;

interface ButtonProps
  extends ButtonPropsVariantProps,
    React.ComponentProps<"button"> {
  text?: string;
  disabled?: boolean;
  isLoading?: boolean;
  trailingIcon?: IconName;
  leadingIcon?: IconName;
  icon?: IconName;
}

type VariantButtonProps = Omit<ButtonProps, "variant">;

const ButtonIcon = ({ icon }: { icon: React.ReactNode | IconName }) => {
  return <Icon name={icon as IconName} className="size-4 text-inherit" />;
};

const LoadingIcon = () => {
  return (
    <Icon name="loading-stripe" className="size-4 animate-spin text-inherit" />
  );
};

export const Button: React.FC<ButtonProps> & {
  Primary: React.FC<VariantButtonProps>;
  PrimaryDark: React.FC<VariantButtonProps>;
  Secondary: React.FC<VariantButtonProps>;
  Tertiary: React.FC<VariantButtonProps>;
} = ({
  variant,
  text,
  disabled,
  isLoading,
  children,
  leadingIcon,
  trailingIcon,
  icon,
  className,
  ...props
}) => {
  const TextComponent =
    variant === ButtonVariantEnum.Tertiary ? Text.Link : Text.Body2;

  const LeadingIcon = isLoading ? (
    <LoadingIcon />
  ) : leadingIcon ? (
    <ButtonIcon icon={leadingIcon} />
  ) : null;

  const TrailingIcon = trailingIcon ? <ButtonIcon icon={trailingIcon} /> : null;

  const isDisabled = isLoading || disabled;

  const mergedClassName = twMerge(
    buttonVariants({ variant, disabled: isDisabled }),
    TrailingIcon || LeadingIcon ? "flex items-center justify-center gap-2" : "",
    className,
  );

  if (icon && !text && !children) {
    return (
      <button
        className={twMerge(mergedClassName, "w-fit p-2.5")}
        disabled={isDisabled}
        {...props}
      >
        <ButtonIcon icon={icon} />
      </button>
    );
  }

  return (
    <button className={mergedClassName} disabled={isDisabled} {...props}>
      {LeadingIcon}
      {children
        ? children
        : text && (
            <TextComponent className="text-inherit">{text}</TextComponent>
          )}
      {TrailingIcon}
    </button>
  );
};

Button.Primary = (props) => {
  return <Button variant={ButtonVariantEnum.Primary} {...props} />;
};

Button.PrimaryDark = (props) => {
  return <Button variant={ButtonVariantEnum.PrimaryDark} {...props} />;
};

Button.Secondary = (props) => {
  return <Button variant={ButtonVariantEnum.Secondary} {...props} />;
};

Button.Tertiary = (props) => {
  return <Button variant={ButtonVariantEnum.Tertiary} {...props} />;
};
