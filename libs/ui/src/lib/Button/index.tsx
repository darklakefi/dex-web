import { type VariantProps, cva } from "class-variance-authority";
import Text from "../Text";

export enum ButtonVariantEnum {
  Primary = "primary",
  PrimaryDark = "primary-dark",
  Secondary = "secondary",
  Tertiary = "tertiary",
}

const buttonVariants = cva(
  "outline-offset-1 focus:outline focus:outline-solid",
  {
    variants: {
      variant: {
        primary:
          "bg-green-100 px-3 py-1 hover:bg-green-200 focus:outline-green-100",
        "primary-dark":
          "bg-green-700 px-3 py-1 hover:bg-green-600 focus:outline-green-700",
        secondary: "bg-green-500 px-3 py-1 focus:outline-green-200",
        tertiary: "px-1 focus:outline-green-200",
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

const textColorVariants = cva("", {
  variants: {
    variant: {
      primary: "text-green-700",
      "primary-dark": "text-green-100",
      secondary: "text-green-200 hover:text-green-100",
      tertiary: "text-green-300 hover:text-green-200",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

type ButtonPropsVariantProps = VariantProps<typeof buttonVariants>;

interface ButtonProps
  extends ButtonPropsVariantProps,
    React.ComponentProps<"button"> {
  text?: string;
  disabled?: boolean;
}

type VariantButtonProps = Omit<ButtonProps, "variant">;

export const Button: React.FC<ButtonProps> & {
  Primary: React.FC<VariantButtonProps>;
  PrimaryDark: React.FC<VariantButtonProps>;
  Secondary: React.FC<VariantButtonProps>;
  Tertiary: React.FC<VariantButtonProps>;
} = ({ variant, text, disabled, children, ...props }) => {

  const TextComponent =
    variant === ButtonVariantEnum.Tertiary ? Text.Link : Text.Body2;

  return (
    <button
      className={buttonVariants({ variant, disabled })}
      disabled={disabled}
      {...props}
    >
      {children
        ? children
        : text && (
            <TextComponent
              color={textColorVariants({ variant })}
              className="uppercase"
            >
              {text}
            </TextComponent>
          )}
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

export default Button;
