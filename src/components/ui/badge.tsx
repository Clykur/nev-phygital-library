import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { STATUS_CHIP_EMERALD } from "@/lib/status-chip-tones"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover-elevate",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
        outline: "text-foreground border border-border",
        solid: "border-transparent shadow-xs",
        soft: "",
        success: "shadow-xs bg-emerald-100/50 text-emerald-800 border-emerald-200", // backward compatibility
      },
      status: {
        default: "",
        success: "",
        warning: "",
        error: "",
        info: "",
        neutral: "",
      }
    },
    compoundVariants: [
      // Solid variants
      { variant: "solid", status: "success", className: "bg-success text-success-foreground" },
      { variant: "solid", status: "error", className: "bg-error text-error-foreground" },
      { variant: "solid", status: "warning", className: "bg-warning text-warning-foreground" },
      { variant: "solid", status: "info", className: "bg-info text-info-foreground" },
      { variant: "solid", status: "neutral", className: "bg-neutral text-neutral-foreground" },
      
      // Soft variants
      { variant: "soft", status: "success", className: "bg-success-surface text-success-foreground border-success-border" },
      { variant: "soft", status: "error", className: "bg-error-surface text-error-foreground border-error-border" },
      { variant: "soft", status: "warning", className: "bg-warning-surface text-warning-foreground border-warning-border" },
      { variant: "soft", status: "info", className: "bg-info-surface text-info-foreground border-info-border" },
      { variant: "soft", status: "neutral", className: "bg-neutral-surface text-neutral-foreground border-neutral-border" },

      // Outline variants
      { variant: "outline", status: "success", className: "text-success-foreground border-success bg-transparent" },
      { variant: "outline", status: "error", className: "text-error-foreground border-error bg-transparent" },
      { variant: "outline", status: "warning", className: "text-warning-foreground border-warning bg-transparent" },
      { variant: "outline", status: "info", className: "text-info-foreground border-info bg-transparent" },
      { variant: "outline", status: "neutral", className: "text-neutral-foreground border-neutral bg-transparent" },
    ],
    defaultVariants: {
      variant: "default",
      status: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, status, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, status }), className)} {...props} />
  )
}

export { Badge, badgeVariants }