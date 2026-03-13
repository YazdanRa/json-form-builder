import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_10px_28px_rgba(0,122,255,0.3)] hover:bg-primary/92",
        secondary: "bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:bg-secondary/92",
        outline:
          "border border-slate-300/80 bg-white/84 text-foreground shadow-[0_1px_1px_rgba(15,23,42,0.05),0_12px_28px_rgba(15,23,42,0.09)] backdrop-blur hover:bg-white",
        ghost: "text-foreground hover:bg-white/70",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_8px_24px_rgba(255,59,48,0.22)] hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
