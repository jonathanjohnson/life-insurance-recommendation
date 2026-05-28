import * as React from "react";
import { Phone } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const phoneCtaVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-foreground hover:bg-brand/90",
        secondary: "bg-foreground text-background hover:bg-foreground/90",
        ghost: "text-brand hover:bg-brand-muted",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-sm",
        md: "h-11 rounded-md px-5 text-sm",
        lg: "h-12 rounded-lg px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface PhoneCTAProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    VariantProps<typeof phoneCtaVariants> {
  /** E.164 or formatted digits used in the `tel:` href. */
  phoneNumber: string;
  /** What's displayed to the user; defaults to phoneNumber. */
  displayNumber?: string;
  /** Where this CTA lives — surfaced as data-cta-location for analytics. */
  location: string;
  showIcon?: boolean;
}

export function PhoneCTA({
  phoneNumber,
  displayNumber,
  location,
  variant,
  size,
  showIcon = true,
  className,
  ...props
}: PhoneCTAProps) {
  const sanitized = phoneNumber.replace(/[^+\d]/g, "");
  return (
    <a
      href={`tel:${sanitized}`}
      data-cta="phone"
      data-cta-location={location}
      data-cta-number={sanitized}
      className={cn(phoneCtaVariants({ variant, size }), className)}
      {...props}
    >
      {showIcon && <Phone aria-hidden className="size-4" />}
      <span>{displayNumber ?? phoneNumber}</span>
    </a>
  );
}
