import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.97] shadow-sm",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-[0.97]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.97] shadow-sm",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground active:scale-[0.97]",
        link: 
          "text-primary underline-offset-4 hover:underline",
        // New Linear-inspired variants
        subtle:
          "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97] border border-transparent",
        gradient:
          "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 active:scale-[0.97] shadow-lg shadow-primary/25",
        floating:
          "bg-card/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-card/90 hover:border-border active:scale-[0.97] shadow-lg",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
        "icon-lg": "h-11 w-11",
        // New Linear-inspired sizes
        compact: "h-7 px-2.5 py-1 text-xs",
        wide: "h-9 px-6 py-2",
      },
      loading: {
        true: "cursor-wait opacity-70",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
)

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "size">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading, 
    leftIcon,
    rightIcon,
    asChild = false, 
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : motion.button
    
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17 
        }}
        {...props}
      >
        {loading && (
          <motion.div
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        )}
        {!loading && leftIcon && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {leftIcon}
          </motion.span>
        )}
        {children}
        {!loading && rightIcon && (
          <motion.span
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {rightIcon}
          </motion.span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Button group for related actions
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex rounded-md shadow-sm",
          orientation === "horizontal" 
            ? "flex-row [&>button:first-child]:rounded-r-none [&>button:last-child]:rounded-l-none [&>button:not(:first-child):not(:last-child)]:rounded-none [&>button:not(:first-child)]:border-l-0"
            : "flex-col [&>button:first-child]:rounded-b-none [&>button:last-child]:rounded-t-none [&>button:not(:first-child):not(:last-child)]:rounded-none [&>button:not(:first-child)]:border-t-0",
          className
        )}
        {...props}
      />
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

// Icon button wrapper for common patterns
export interface IconButtonProps extends Omit<ButtonProps, "leftIcon" | "rightIcon"> {
  icon: React.ReactNode
  label?: string
  showTooltip?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("shrink-0", className)}
        aria-label={label}
        size="icon"
        {...props}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

// Floating Action Button
export interface FABProps extends ButtonProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ position = "bottom-right", className, ...props }, ref) => {
    const positionClasses = {
      "bottom-right": "fixed bottom-6 right-6",
      "bottom-left": "fixed bottom-6 left-6", 
      "top-right": "fixed top-6 right-6",
      "top-left": "fixed top-6 left-6",
    }

    return (
      <Button
        ref={ref}
        variant="floating"
        size="icon-lg"
        className={cn(
          positionClasses[position],
          "z-50 shadow-xl shadow-primary/25",
          className
        )}
        {...props}
      />
    )
  }
)
FAB.displayName = "FAB"

export { Button, ButtonGroup, IconButton, FAB, buttonVariants }
