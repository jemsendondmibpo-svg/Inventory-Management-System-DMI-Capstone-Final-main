import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.01em] transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:translate-y-[1px] [text-shadow:0_1px_0_rgba(255,255,255,0.08)]",
  {
    variants: {
      variant: {
        default:
          "border border-primary/40 bg-linear-to-b from-primary via-primary to-[#96a800] text-[#132100] shadow-[0_10px_24px_rgba(176,191,0,0.24)] hover:-translate-y-0.5 hover:from-[#bccb1f] hover:to-[#8d9c00] hover:shadow-[0_16px_32px_rgba(176,191,0,0.3)] dark:text-[#07111f]",
        destructive:
          "border border-destructive/30 bg-linear-to-b from-destructive to-red-600 text-white shadow-[0_10px_24px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 hover:from-red-500 hover:to-red-700 hover:shadow-[0_16px_32px_rgba(239,68,68,0.28)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 dark:text-white",
        outline:
          "border border-border/80 bg-background/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-accent hover:text-[#445000] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_28px_rgba(15,23,42,0.1)] dark:bg-input/30 dark:border-input dark:text-slate-50 dark:hover:bg-input/50 dark:hover:text-[#e8f28a]",
        secondary:
          "border border-secondary/30 bg-linear-to-b from-secondary to-[#a9bb0d] text-[#182300] shadow-[0_10px_22px_rgba(197,211,0,0.18)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_16px_28px_rgba(197,211,0,0.24)] dark:text-[#07111f]",
        ghost:
          "text-slate-800 hover:-translate-y-0.5 hover:bg-accent/90 hover:text-[#3f4d00] dark:text-slate-100 dark:hover:bg-accent/50 dark:hover:text-[#e8f28a]",
        link: "rounded-md px-0 text-[#6b7500] shadow-none hover:text-[#4d5600] hover:underline underline-offset-4 dark:text-[#d7e25f] dark:hover:text-[#f1f8ad]",
      },
      size: {
        default: "h-10 px-4 py-2.5 has-[>svg]:px-3.5",
        sm: "h-9 gap-1.5 rounded-lg px-3.5 has-[>svg]:px-3",
        lg: "h-11 px-6 has-[>svg]:px-4.5",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
