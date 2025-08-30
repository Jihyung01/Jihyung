import React from 'react'
import { motion, MotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ===============================================
   Next-Gen Button System
   Inspired by Linear, Notion, Raycast, Arc
   =============================================== */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'magnetic' | 'glass' | 'gradient' | 'neumorph'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  motionProps?: MotionProps
  glow?: boolean
  magnetic?: boolean
}

const buttonVariants = {
  variant: {
    default: [
      'bg-card hover:bg-card-elevated border border-border hover:border-border-hover',
      'text-foreground shadow-sm hover:shadow-md',
      'transition-all duration-200 ease-out'
    ].join(' '),
    
    primary: [
      'bg-gradient-primary text-white border-0 font-semibold',
      'shadow-lg hover:shadow-xl',
      'hover:scale-[1.02] active:scale-[0.98]',
      'transition-all duration-200 ease-out'
    ].join(' '),
    
    secondary: [
      'bg-muted hover:bg-muted/80 border border-border',
      'text-foreground hover:text-foreground',
      'shadow-sm hover:shadow-md',
      'transition-all duration-200 ease-out'
    ].join(' '),
    
    ghost: [
      'bg-transparent hover:bg-muted border-0',
      'text-foreground-muted hover:text-foreground',
      'transition-all duration-200 ease-out'
    ].join(' '),
    
    magnetic: [
      'btn-magnetic relative overflow-hidden',
      'hover:scale-[1.02] active:scale-[0.98]'
    ].join(' '),
    
    glass: [
      'glass-card bg-glass text-foreground',
      'hover:bg-glass-strong backdrop-blur-md',
      'border border-white/10 hover:border-white/20',
      'transition-all duration-300 ease-out'
    ].join(' '),
    
    gradient: [
      'bg-gradient-primary text-white border-0 font-semibold',
      'hover:shadow-lg hover:shadow-primary/25',
      'hover:scale-[1.02] active:scale-[0.98]',
      'transition-all duration-200 ease-out'
    ].join(' '),
    
    neumorph: [
      'neumorph text-foreground font-medium',
      'hover:shadow-lg active:shadow-sm',
      'transition-all duration-200 ease-out'
    ].join(' ')
  },
  
  size: {
    sm: 'h-8 px-3 text-xs rounded-md',
    md: 'h-9 px-4 text-sm rounded-lg',
    lg: 'h-10 px-6 text-base rounded-lg',
    xl: 'h-12 px-8 text-lg rounded-xl',
    icon: 'h-9 w-9 rounded-lg p-0'
  }
}

const motionVariants = {
  tap: { scale: 0.95 },
  hover: { scale: 1.02, y: -2 },
  magnetic: {
    hover: {
      scale: 1.05,
      y: -4,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
    },
    tap: { scale: 0.98, y: -2 }
  },
  glow: {
    hover: {
      boxShadow: [
        '0 0 20px rgba(139, 92, 246, 0.3)',
        '0 4px 15px rgba(0, 0, 0, 0.1)'
      ].join(', ')
    }
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'default',
  size = 'md',
  className,
  isLoading = false,
  leftIcon,
  rightIcon,
  motionProps,
  glow = false,
  magnetic = false,
  disabled,
  ...props
}, ref) => {
  const MotionButton = motion.button

  const getMotionProps = (): MotionProps => {
    const baseProps: MotionProps = {
      whileTap: motionVariants.tap,
      transition: { type: 'spring', stiffness: 400, damping: 25 },
      ...motionProps
    }

    if (magnetic || variant === 'magnetic') {
      return {
        ...baseProps,
        whileHover: motionVariants.magnetic.hover,
        whileTap: motionVariants.magnetic.tap
      }
    }

    if (glow) {
      return {
        ...baseProps,
        whileHover: motionVariants.glow.hover
      }
    }

    if (variant === 'primary' || variant === 'gradient') {
      return {
        ...baseProps,
        whileHover: motionVariants.hover
      }
    }

    return baseProps
  }

  return (
    <MotionButton
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-medium focus-ring',
        'disabled:opacity-50 disabled:pointer-events-none',
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        glow && 'hover-glow',
        className
      )}
      disabled={disabled || isLoading}
      {...getMotionProps()}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="loading-spinner" />
          <span className="opacity-50">Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </MotionButton>
  )
})

Button.displayName = 'Button'

/* ===============================================
   Specialized Button Components
   =============================================== */

export const MagneticButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} {...props} variant="magnetic" magnetic />
)

export const GlassButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} {...props} variant="glass" />
)

export const GradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} {...props} variant="gradient" />
)

export const NeumorphButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} {...props} variant="neumorph" />
)

export const GlowButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} {...props} glow />
)

/* ===============================================
   Floating Action Button
   =============================================== */

interface FABProps extends Omit<ButtonProps, 'size' | 'variant'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  offset?: number
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(({
  children,
  className,
  position = 'bottom-right',
  offset = 24,
  ...props
}, ref) => {
  const positionClasses = {
    'bottom-right': `bottom-[${offset}px] right-[${offset}px]`,
    'bottom-left': `bottom-[${offset}px] left-[${offset}px]`,
    'top-right': `top-[${offset}px] right-[${offset}px]`,
    'top-left': `top-[${offset}px] left-[${offset}px]`
  }

  return (
    <motion.button
      ref={ref}
      className={cn(
        'fab fixed z-50',
        'flex items-center justify-center',
        'w-14 h-14 rounded-full',
        'bg-primary text-white shadow-lg',
        'hover:scale-110 active:scale-105',
        'transition-all duration-200 ease-spring',
        positionClasses[position],
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.button>
  )
})

FloatingActionButton.displayName = 'FloatingActionButton'

/* ===============================================
   Button Group
   =============================================== */

interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  size?: ButtonProps['size']
  variant?: ButtonProps['variant']
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(({
  children,
  className,
  orientation = 'horizontal',
  size = 'md',
  variant = 'default',
  ...props
}, ref) => {
  const groupClasses = {
    horizontal: 'flex-row [&>*:not(:first-child)]:ml-[-1px] [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none',
    vertical: 'flex-col [&>*:not(:first-child)]:mt-[-1px] [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none'
  }

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex',
        groupClasses[orientation],
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Button) {
          return React.cloneElement(child, {
            size: child.props.size || size,
            variant: child.props.variant || variant
          })
        }
        return child
      })}
    </div>
  )
})

ButtonGroup.displayName = 'ButtonGroup'

/* ===============================================
   Icon Button
   =============================================== */

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode
  label?: string
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      size="icon"
      variant={variant}
      className={cn(
        buttonVariants.size[size],
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      {icon}
    </Button>
  )
})

IconButton.displayName = 'IconButton'

/* ===============================================
   Loading Button
   =============================================== */

interface LoadingButtonProps extends ButtonProps {
  loadingText?: string
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(({
  children,
  loadingText = 'Loading...',
  isLoading,
  disabled,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="loading-spinner" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
})

LoadingButton.displayName = 'LoadingButton'
