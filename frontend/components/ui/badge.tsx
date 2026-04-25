import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "brand" | "secondary" | "danger" | "outline";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2";
  
  const variants = {
    default: "bg-surface-2 text-foreground border border-border",
    brand: "bg-brand/10 text-brand border border-brand/20",
    secondary: "bg-secondary/10 text-secondary border border-secondary/20",
    danger: "bg-danger/10 text-danger border border-danger/20",
    outline: "text-foreground border border-border",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
}
