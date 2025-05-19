import { type VariantProps, cva } from "class-variance-authority";

export enum TypographyVariantEnum {
  Heading = "heading",
  Heading1 = "heading1",
  Body = "body",
  Body1 = "body1",
  Body2 = "body2",
  Link = "link",
}

type JSXElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "div";

const typographyVariants = cva("", {
  variants: {
    variant: {
      // biome-ignore lint/nursery/useSortedClasses: <explanation>
      heading: "font-normal text-3xl leading-3xl tracking-normal text-brand-20",
      heading1:
        // biome-ignore lint/nursery/useSortedClasses: <explanation>
        "font-normal text-3xl leading-3xl tracking-normal text-brand-30",
      // biome-ignore lint/nursery/useSortedClasses: <explanation>
      body: "font-normal text-3xl leading-3xl tracking-normal text-brand-20",
      // biome-ignore lint/nursery/useSortedClasses: <explanation>
      body1: "font-normal text-3xl leading-4xl tracking-wider text-brand-30",
      // biome-ignore lint/nursery/useSortedClasses: <explanation>
      body2: "font-normal text-lg leading-2xl tracking-wide text-brand-30",
      // biome-ignore lint/nursery/useSortedClasses: <explanation>
      link: "font-normal text-lg leading-2xl tracking-wide text-brand-30 underline",
    },
  },
});

type TypographyPropsVariantProps = VariantProps<typeof typographyVariants>;
interface TypographyProps extends TypographyPropsVariantProps {
  children: React.ReactNode;
}

const variantMap: { [key: string]: JSXElement } = {
  [TypographyVariantEnum.Heading]: "h1",
  [TypographyVariantEnum.Heading1]: "h1",
  [TypographyVariantEnum.Body]: "p",
  [TypographyVariantEnum.Body1]: "p",
  [TypographyVariantEnum.Body2]: "p",
  [TypographyVariantEnum.Link]: "div",
};

type VariantTypographyProps = Omit<TypographyProps, "variant">;

const Typography: React.FC<TypographyProps> & {
  Heading: React.FC<VariantTypographyProps>;
  Heading1: React.FC<VariantTypographyProps>;
  Body: React.FC<VariantTypographyProps>;
  Body1: React.FC<VariantTypographyProps>;
  Body2: React.FC<VariantTypographyProps>;
  Link: React.FC<VariantTypographyProps>;
} = ({ children, variant, ...props }) => {
  const Component = variantMap[
    variant || TypographyVariantEnum.Body
  ] as JSXElement;
  return (
    <Component className={typographyVariants({ variant })} {...props}>
      {children}
    </Component>
  );
};

Typography.Heading = (props) => {
  return <Typography variant={TypographyVariantEnum.Heading} {...props} />;
};

Typography.Heading1 = (props) => {
  return <Typography variant={TypographyVariantEnum.Heading1} {...props} />;
};

Typography.Body = (props) => {
  return <Typography variant={TypographyVariantEnum.Body} {...props} />;
};

Typography.Body1 = (props) => {
  return <Typography variant={TypographyVariantEnum.Body1} {...props} />;
};

Typography.Body2 = (props) => {
  return <Typography variant={TypographyVariantEnum.Body2} {...props} />;
};

Typography.Link = (props) => {
  return <Typography variant={TypographyVariantEnum.Link} {...props} />;
};

export default Typography;
