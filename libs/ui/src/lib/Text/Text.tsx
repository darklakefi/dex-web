import { type VariantProps, cva } from "class-variance-authority";
import type { ElementType } from "react";
import { twMerge } from "tailwind-merge";

export enum TextVariantEnum {
  Heading = "heading",
  Body1 = "body1",
  Body2 = "body2",
  Link = "link",
}

const textVariants = cva("font-normal", {
  variants: {
    variant: {
      heading:
        "font-display text-3xl text-green-100 leading-7.5 tracking-normal",
      body1: "font-sans text-3xl text-green-100 leading-8.5 tracking-wider",
      body2: "font-sans text-green-200 text-lg leading-6 tracking-wide",
      link: "font-sans text-green-200 text-lg leading-6 tracking-wide underline",
    },
    textCase: {
      uppercase: "uppercase",
      lowercase: "lowercase",
      capitalize: "capitalize",
      "normal-case": "normal-case",
    },
  },
});

const variantMap: { [key: string]: ElementType } = {
  [TextVariantEnum.Heading]: "h1",
  [TextVariantEnum.Body1]: "p",
  [TextVariantEnum.Body2]: "p",
  [TextVariantEnum.Link]: "div",
};

type TextPropsVariantProps = VariantProps<typeof textVariants>;
interface TextProps extends TextPropsVariantProps, React.ComponentProps<"div"> {
  children: React.ReactNode;
  textCase?: "uppercase" | "lowercase" | "capitalize" | "normal-case";
}

type VariantTextProps = Omit<TextProps, "variant">;

export const Text: React.FC<TextProps> & {
  Heading: React.FC<VariantTextProps>;
  Body1: React.FC<VariantTextProps>;
  Body2: React.FC<VariantTextProps>;
  Link: React.FC<VariantTextProps>;
} = ({
  children,
  variant,
  textCase = "uppercase",
  className = "",
  ...props
}) => {
  const Component = variantMap[variant || TextVariantEnum.Body1] as ElementType;
  const overrideClasses = twMerge(
    textVariants({ variant, textCase }),
    className,
  );

  return (
    <Component className={overrideClasses} {...props}>
      {children}
    </Component>
  );
};

Text.Heading = (props) => {
  return <Text variant={TextVariantEnum.Heading} {...props} />;
};

Text.Body1 = (props) => {
  return <Text variant={TextVariantEnum.Body1} {...props} />;
};

Text.Body2 = (props) => {
  return <Text variant={TextVariantEnum.Body2} {...props} />;
};

Text.Link = (props) => {
  return <Text variant={TextVariantEnum.Link} {...props} />;
};

export default Text;
