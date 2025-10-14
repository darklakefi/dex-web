import Image from "next/image";
import { twMerge } from "tailwind-merge";

interface HeroProps extends React.HTMLAttributes<HTMLDivElement> {
  image: string;
  imageClassName?: string;
  imageHeight?: number;
  imageWidth?: number;
  imagePosition?: "start" | "end";
}

export function Hero({
  children,
  className,
  image,
  imageClassName,
  imageHeight,
  imageWidth,
  imagePosition = "end",
  ...props
}: HeroProps) {
  return (
    <div
      className={twMerge(
        "relative flex items-center justify-between",
        className,
      )}
      {...props}
    >
      {imagePosition === "start" && (
        <Image
          alt="Waddles"
          className={twMerge("absolute left-0 self-start", imageClassName)}
          height={imageHeight ?? 420}
          src={image}
          width={imageWidth ?? 200}
        />
      )}
      {children}
      {imagePosition === "end" && (
        <Image
          alt="Waddles"
          className={twMerge("absolute right-0 self-end", imageClassName)}
          height={imageHeight ?? 420}
          src={image}
          width={imageWidth ?? 200}
        />
      )}
    </div>
  );
}
