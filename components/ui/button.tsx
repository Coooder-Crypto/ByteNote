import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30",
        destructive:
          "bg-destructive text-white shadow-md shadow-destructive/20 hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/30",
        outline:
          "border border-border/70 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 has-[>svg]:px-4",
        sm: "h-9 gap-2 rounded-lg px-4 has-[>svg]:px-3",
        lg: "h-12 text-base px-6 has-[>svg]:px-5",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
