import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "bg-blue-100 text-blue-800",
  secondary: "bg-gray-100 text-gray-800",
  destructive: "bg-red-100 text-red-800",
  outline: "text-gray-800 border border-gray-200",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants } 