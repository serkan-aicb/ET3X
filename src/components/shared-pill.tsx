import * as React from "react"
import { cn } from "@/lib/utils"

interface SharedPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary";
}

function SharedPill({ 
  className, 
  variant = "default",
  children, 
  ...props 
}: SharedPillProps) {
  const variantClasses = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary text-secondary-foreground",
  };
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { SharedPill }