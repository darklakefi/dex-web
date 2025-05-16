import { type VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva("rounded-md bg-blue-500 p-2 text-white", {
	variants: {
		variant: {
			primary: "bg-blue-500",
			secondary: "bg-red-500",
		},
	},
});

type ExampleButtonPropsVariantProps = VariantProps<typeof buttonVariants>;
interface ExampleButtonProps extends ExampleButtonPropsVariantProps {
	children: React.ReactNode;
}

export function ExampleButton({
	children,
	variant = "primary",
}: ExampleButtonProps) {
	return (
		<button className={buttonVariants({ variant })} type="button">
			{children}
		</button>
	);
}

export default ExampleButton;
