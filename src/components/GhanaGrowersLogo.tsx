import Image, { type ImageProps } from "next/image";

type LogoLayout = "horizontal" | "stacked" | "icon";
type LogoTone = "primary" | "reverse" | "monochrome";

type GhanaGrowersLogoProps = Omit<ImageProps, "alt" | "height" | "src" | "width"> & {
  decorative?: boolean;
  layout?: LogoLayout;
  tone?: LogoTone;
};

const sources: Record<LogoLayout, Record<LogoTone, { height: number; src: string; width: number }>> = {
  horizontal: {
    primary: { src: "/brand/ghana-growers-logo-horizontal.svg", width: 820, height: 260 },
    reverse: { src: "/brand/ghana-growers-logo-horizontal-reverse.svg", width: 820, height: 260 },
    monochrome: { src: "/brand/ghana-growers-logo-monochrome.svg", width: 720, height: 760 }
  },
  stacked: {
    primary: { src: "/brand/ghana-growers-logo-stacked.svg", width: 720, height: 760 },
    reverse: { src: "/brand/ghana-growers-logo-reverse.svg", width: 720, height: 760 },
    monochrome: { src: "/brand/ghana-growers-logo-monochrome.svg", width: 720, height: 760 }
  },
  icon: {
    primary: { src: "/brand/ghana-growers-icon.svg", width: 512, height: 512 },
    reverse: { src: "/brand/ghana-growers-icon-reverse.svg", width: 512, height: 512 },
    monochrome: { src: "/brand/ghana-growers-icon.svg", width: 512, height: 512 }
  }
};

export function GhanaGrowersLogo({ className, decorative = false, layout = "horizontal", tone = "primary", ...props }: GhanaGrowersLogoProps) {
  const asset = sources[layout][tone];

  return (
    <Image
      {...props}
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={decorative ? "" : "Ghana Growers"}
      aria-hidden={decorative || undefined}
      className={className}
      decoding="async"
    />
  );
}
