"use client";

import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
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
  [
    "inline-flex items-center justify-center gap-2",
    "font-normal uppercase leading-none tracking-wider",
    "outline-offset-1 focus:outline-2 focus:outline-solid",
    "transition-colors duration-200",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "[&>*]:flex [&>*]:items-center [&>*]:leading-none",
  ],
  {
    defaultVariants: {
      loading: false,
      size: "md",
      variant: "primary",
    },
    variants: {
      loading: {
        false: null,
        true: "cursor-progress opacity-50",
      },
      size: {
        icon: "w-fit p-2.5",
        lg: "px-4 py-2 text-lg",
        md: "px-3 py-1.5",
        sm: "px-2 py-1 text-sm",
      },
      variant: {
        primary:
          "bg-green-100 text-green-700 hover:bg-green-200 focus:outline-white",
        "primary-dark":
          "bg-green-700 text-green-100 hover:bg-green-600 focus:outline-white",
        secondary:
          "bg-green-500 text-green-200 hover:text-green-100 focus:text-green-100 focus:outline-white",
        tertiary:
          "text-green-300 hover:text-green-200 focus:text-green-200 focus:outline-white",
      },
    },
  },
);

type ButtonProps<
  TElement extends React.ElementType,
  TProps extends
    React.ComponentProps<TElement> = React.ComponentProps<TElement>,
> = {
  as?: React.ElementType;
  text?: string;
  disabled?: boolean;
  loading?: boolean;
  trailingIcon?: IconName;
  leadingIcon?: IconName;
  icon?: IconName;
  iconClassName?: string;
} & TProps &
  VariantProps<typeof buttonVariants>;

const ButtonIcon = ({
  icon,
  className,
}: {
  icon: React.ReactNode | IconName;
  className?: string;
}) => {
  return (
    <Icon
      className={twMerge("size-4 text-inherit", className)}
      name={icon as IconName}
    />
  );
};

const LoadingIcon = () => {
  return (
    <Icon
      className="size-4 animate-spin-pause text-inherit"
      name="loading-stripe"
    />
  );
};

export function Button<TElement extends React.ElementType>(
  props: ButtonProps<TElement>,
) {
  const {
    size,
    variant,
    text,
    loading,
    children,
    leadingIcon,
    trailingIcon,
    as = "button",
    icon,
    iconClassName,
    className,
    ...restProps
  } = props;

  const TextComponent =
    variant === ButtonVariantEnum.Tertiary ? Text.Link : Text.Body2;
  const ButtonComponent = as;

  if (!ButtonComponent) {
    throw new Error(`Invalid component type: ${as}`);
  }

  const LeadingIcon = loading ? (
    <LoadingIcon />
  ) : leadingIcon ? (
    <ButtonIcon icon={leadingIcon} />
  ) : null;

  const TrailingIcon = trailingIcon ? <ButtonIcon icon={trailingIcon} /> : null;

  const mergedClassName = twMerge(
    buttonVariants({ loading, size, variant }),
    TrailingIcon || LeadingIcon ? "flex items-center justify-center gap-2" : "",
    className,
  );

  const buttonChildren =
    icon && !text && !children
      ? [<ButtonIcon className={iconClassName} icon={icon} key="icon-only" />]
      : [
          LeadingIcon,
          children ??
            (text && (
              <TextComponent className="text-inherit" key="text">
                {text}
              </TextComponent>
            )),
          TrailingIcon,
        ].filter(Boolean);

  const elementProps = {
    className:
      icon && !text && !children
        ? twMerge(mergedClassName, "w-fit p-2.5")
        : mergedClassName,
    loading,
    ...restProps,
  };

  return React.createElement(ButtonComponent, elementProps, ...buttonChildren);
}
