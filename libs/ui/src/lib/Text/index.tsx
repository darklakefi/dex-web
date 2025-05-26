import { type VariantProps, cva } from "class-variance-authority";
import type { ElementType } from "react";

export enum TextVariantEnum {
  Heading = "heading",
  Heading1 = "heading1",
  Body = "body",
  Body1 = "body1",
  Body2 = "body2",
  Link = "link",
}

const textVariants = cva("font-normal", {
  variants: {
    variant: {

      heading: "font-display text-3xl leading-3xl tracking-normal",
      heading1: "font-display text-3xl leading-3xl tracking-normal",
      body: "font-display text-3xl leading-3xl tracking-normal",
      body1: "font-sans text-3xl leading-4xl tracking-wider",
      body2: "font-sans text-lg leading-xl tracking-wide",
      link: "font-sans text-lg leading-xl tracking-wide underline",
    },
  },
});

const textColorVariants = cva("", {
  variants: {
    variant: {
      heading: "text-green-200",
      heading1: "text-green-300",
      body: "text-green-200",
      body1: "text-green-300",
      body2: "text-green-300",
      link: "text-green-300",
    },
  },
});

const variantMap: { [key: string]: ElementType } = {
  [TextVariantEnum.Heading]: "h1",
  [TextVariantEnum.Heading1]: "h1",
  [TextVariantEnum.Body]: "p",
  [TextVariantEnum.Body1]: "p",
  [TextVariantEnum.Body2]: "p",
  [TextVariantEnum.Link]: "div",
};

type TextPropsVariantProps = VariantProps<typeof textVariants>;
interface TextProps extends TextPropsVariantProps, React.ComponentProps<"div"> {
  children: React.ReactNode;
  color?: string;
}

type VariantTextProps = Omit<TextProps, "variant">;

export const Text: React.FC<TextProps> & {
  Heading: React.FC<VariantTextProps>;
  Heading1: React.FC<VariantTextProps>;
  Body: React.FC<VariantTextProps>;
  Body1: React.FC<VariantTextProps>;
  Body2: React.FC<VariantTextProps>;
  Link: React.FC<VariantTextProps>;
} = ({ children, variant, color, className = "", ...props }) => {
  const Component = variantMap[variant || TextVariantEnum.Body] as ElementType;
  const baseClasses = textVariants({ variant });
  const overrideClasses = color
    ? `${baseClasses} ${color}`
    : `${baseClasses} ${textColorVariants({ variant })}`;

  return (
    <Component className={`${overrideClasses} ${className}`} {...props}>
      {children}
    </Component>
  );
};

Text.Heading = (props) => {
  return <Text variant={TextVariantEnum.Heading} {...props} />;
};

Text.Heading1 = (props) => {
  return <Text variant={TextVariantEnum.Heading1} {...props} />;
};

Text.Body = (props) => {
  return <Text variant={TextVariantEnum.Body} {...props} />;
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
