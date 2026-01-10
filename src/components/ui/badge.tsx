import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-caption transition-colors focus:outline-none focus:ring-2 focus:ring-primary-border focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary-50 text-primary-700",
        secondary:
          "bg-surface-alt text-text-secondary",
        destructive:
          "bg-danger-50 text-danger-600",
        outline: 
          "text-text-primary border border-border-subtle",
        success:
          "bg-success-50 text-success-700",
        warning:
          "bg-warning-50 text-[#B45309]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
