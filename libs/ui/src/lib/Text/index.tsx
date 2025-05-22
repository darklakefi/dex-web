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
      heading: "text-3xl text-brand-20 leading-3xl tracking-normal",
      heading1: "text-3xl text-brand-30 leading-3xl tracking-normal",
      body: "text-3xl text-brand-20 leading-3xl tracking-normal",
      body1: "text-3xl text-brand-30 leading-4xl tracking-wider",
      body2: "text-brand-30 text-lg leading-xl tracking-wide",
      link: "text-brand-30 text-lg leading-xl tracking-wide underline",
    },
  },
});

type TextPropsVariantProps = VariantProps<typeof textVariants>;
interface TextProps extends TextPropsVariantProps {
  children: React.ReactNode;
}

const variantMap: { [key: string]: ElementType } = {
  [TextVariantEnum.Heading]: "h1",
  [TextVariantEnum.Heading1]: "h1",
  [TextVariantEnum.Body]: "p",
  [TextVariantEnum.Body1]: "p",
  [TextVariantEnum.Body2]: "p",
  [TextVariantEnum.Link]: "div",
};

type VariantTextProps = Omit<TextProps, "variant">;

const Text: React.FC<TextProps> & {
  Heading: React.FC<VariantTextProps>;
  Heading1: React.FC<VariantTextProps>;
  Body: React.FC<VariantTextProps>;
  Body1: React.FC<VariantTextProps>;
  Body2: React.FC<VariantTextProps>;
  Link: React.FC<VariantTextProps>;
} = ({ children, variant, ...props }) => {
  const Component = variantMap[variant || TextVariantEnum.Body] as ElementType;
  return (
    <Component className={textVariants({ variant })} {...props}>
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
