import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-border focus:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 !text-white border border-transparent hover:bg-primary-700",
        destructive:
          "bg-danger-600 !text-white border border-transparent hover:bg-[#DC2626]",
        outline:
          "bg-primary-600 !text-white border border-primary-700 hover:bg-primary-700",
        secondary:
          "bg-[#6B7280] !text-white border border-transparent hover:bg-[#4B5563]",
        ghost: 
          "bg-primary-600/80 !text-white border border-transparent hover:bg-primary-600",
        link: "text-primary-600 underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-9 px-4 text-body-strong rounded-sm",
        sm: "h-8 px-3 text-body-strong rounded-sm",
        lg: "h-10 px-6 text-body-strong rounded-sm",
        icon: "h-9 w-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
