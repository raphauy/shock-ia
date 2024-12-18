import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        secondaryWithBorder:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-gray-300",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground justify-center",
        open: "bg-green-500 text-white rounded-2xl border-green-800",
        close: "bg-red-500 text-white rounded-2xl border-red-800",
        connecting: "bg-yellow-500 text-white rounded-2xl border-yellow-800",
        ended: "bg-orange-500 text-white rounded-2xl border-orange-800",
        archived: "bg-gray-500 text-white rounded-2xl border-gray-800",
        active: "bg-green-500 text-white rounded-2xl border-green-800",
        stage: "bg-blue-500 text-white rounded-2xl border-blue-800 rounded-md justify-center",
        statusEnviado: "bg-green-500 text-white rounded-2xl border-green-800 rounded-md justify-center",
        statusError: "bg-red-500 text-white rounded-2xl border-red-800 rounded-md justify-center",
        statusPendiente: "bg-yellow-500 text-white rounded-2xl border-yellow-800 rounded-md justify-center",
        statusProgramado: "bg-orange-500 text-white rounded-2xl border-orange-800 rounded-md justify-center",
        api: "bg-orange-500 text-white rounded-2xl border-orange-800 rounded-md justify-center",
        csv: "bg-purple-500 text-white rounded-2xl border-purple-800 rounded-md justify-center",
        manual: "bg-gray-500 text-white rounded-2xl border-gray-800 rounded-md justify-center",
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
