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
          "bg-green-10 px-3 py-1 hover:bg-green-20 focus:outline-green-10",
        "primary-dark":
          "bg-green-70 px-3 py-1 hover:bg-green-60 focus:outline-green-70",
        secondary: "bg-green-50 px-3 py-1 focus:outline-green-20",
        tertiary: "px-1 focus:outline-green-20",
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
      primary: "text-green-70",
      "primary-dark": "text-green-10",
      secondary: "text-green-20",
      tertiary: "text-green-30 hover:text-green-20",
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
  return (
    <button className={buttonVariants({ variant, disabled })} {...props}>
      {children
        ? children
        : text && (
            <Text.Body2 color={textColorVariants({ variant })}>
              {text}
            </Text.Body2>
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
