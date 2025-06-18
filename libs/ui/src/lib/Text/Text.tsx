import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, JSX } from "react";
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
      body1: "font-sans text-3xl text-green-100 leading-8.5 tracking-wider",
      body2: "font-sans text-green-200 text-lg leading-6 tracking-wider",
      heading:
        "font-display text-3xl text-green-100 leading-7.5 tracking-normal",
      link: "font-sans text-green-200 text-lg leading-6 tracking-wide underline",
    },
  },
});

const variantMap: { [key: string]: ElementType } = {
  [TextVariantEnum.Heading]: "h1",
  [TextVariantEnum.Body1]: "p",
  [TextVariantEnum.Body2]: "p",
  [TextVariantEnum.Link]: "div",
} satisfies Record<TextVariantEnum, ElementType>;

type TextVariantProps = VariantProps<typeof textVariants>;

type TextProps<
  TElement extends keyof JSX.IntrinsicElements,
  TProps extends React.ComponentProps<TElement>,
> = {
  as?: keyof JSX.IntrinsicElements;
} & TProps &
  TextVariantProps;

export function Text<
  TElement extends keyof JSX.IntrinsicElements,
  TProps extends React.ComponentProps<TElement>,
>(props: TextProps<TElement, TProps>) {
  const { variant, as, className, children, ...rest } = props;
  const Component = as ?? variantMap[variant || TextVariantEnum.Body1];
  const overrideClasses = twMerge(textVariants({ variant }), className);

  if (!Component) {
    throw new Error(`Invalid component type: ${as}`);
  }

  return (
    <Component className={overrideClasses} {...rest}>
      {children}
    </Component>
  );
}

Text.Heading = (props: TextProps<"h1", React.ComponentProps<"h1">>) => {
  return <Text variant={TextVariantEnum.Heading} {...props} />;
};

Text.Body1 = (props: TextProps<"p", React.ComponentProps<"p">>) => {
  return <Text variant={TextVariantEnum.Body1} {...props} />;
};

Text.Body2 = (props: TextProps<"p", React.ComponentProps<"p">>) => {
  return <Text variant={TextVariantEnum.Body2} {...props} />;
};

Text.Link = (props: TextProps<"div", React.ComponentProps<"div">>) => {
  return <Text variant={TextVariantEnum.Link} {...props} />;
};
