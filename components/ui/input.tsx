import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md bg-paper px-3 py-1 text-sm transition-colors",
        "border border-pencil/10 font-notebook text-pencil/80",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "placeholder:text-pencil/50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
