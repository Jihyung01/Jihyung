import React from 'react'
import { motion, MotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ===============================================
   Next-Gen Card System
   Glass morphism, Neumorphism, Advanced animations
   =============================================== */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'neumorph' | 'elevated' | 'outline' | 'gradient'
  hover?: 'lift' | 'glow' | 'scale' | 'none'
  interactive?: boolean
  motionProps?: MotionProps
  children?: React.ReactNode
}

const cardVariants = {
  variant: {
    default: [
      'bg-card border border-border',
      'shadow-sm hover:shadow-md',
      'rounded-lg transition-all duration-200'
    ].join(' '),
    
    glass: [
      'glass-card backdrop-blur-md',
      'bg-white/5 border border-white/10',
      'hover:bg-white/10 hover:border-white/20',
      'rounded-xl transition-all duration-300'
    ].join(' '),
    
    neumorph: [
      'neumorph bg-background-elevated',
      'hover:shadow-xl transition-all duration-300',
      'rounded-xl'
    ].join(' '),
    
    elevated: [
      'bg-card-elevated border border-border-subtle',
      'shadow-lg hover:shadow-xl',
      'rounded-lg transition-all duration-200'
    ].join(' '),
    
    outline: [
      'bg-transparent border-2 border-border',
      'hover:border-border-hover hover:bg-muted/50',
      'rounded-lg transition-all duration-200'
    ].join(' '),
    
    gradient: [
      'bg-gradient-primary text-white border-0',
      'shadow-lg hover:shadow-xl',
      'rounded-lg transition-all duration-200'
    ].join(' ')
  },
  
  hover: {
    lift: 'hover-lift',
    glow: 'hover-glow',
    scale: 'hover:scale-[1.02] transition-transform duration-200',
    none: ''
  }
}

const motionVariants = {
  container: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  },
  
  interactive: {
    hover: {
      y: -4,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    }
  },
  
  glass: {
    hover: {
      backdropFilter: 'blur(20px) saturate(180%)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  }
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  children,
  className,
  variant = 'default',
  hover = 'none',
  interactive = false,
  motionProps,
  ...props
}, ref) => {
  const MotionDiv = motion.div

  const getMotionProps = (): MotionProps => {
    const baseProps: MotionProps = {
      initial: 'hidden',
      animate: 'visible',
      variants: motionVariants.container,
      ...motionProps
    }

    if (interactive) {
      return {
        ...baseProps,
        whileHover: motionVariants.interactive.hover,
        whileTap: motionVariants.interactive.tap
      }
    }

    if (variant === 'glass') {
      return {
        ...baseProps,
        whileHover: motionVariants.glass.hover
      }
    }

    return baseProps
  }

  return (
    <MotionDiv
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        cardVariants.variant[variant],
        cardVariants.hover[hover],
        interactive && 'cursor-pointer',
        className
      )}
      {...getMotionProps()}
      {...props}
    >
      {children}
    </MotionDiv>
  )
})

Card.displayName = 'Card'

/* ===============================================
   Card Sub-components
   =============================================== */

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  children,
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('p-6 pb-4', className)}
    {...props}
  >
    {children}
  </div>
))

CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({
  children,
  className,
  ...props
}, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold text-foreground',
      'leading-none tracking-tight',
      className
    )}
    {...props}
  >
    {children}
  </h3>
))

CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({
  children,
  className,
  ...props
}, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-foreground-muted mt-2', className)}
    {...props}
  >
    {children}
  </p>
))

CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  children,
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
))

CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  children,
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('p-6 pt-0 flex items-center gap-2', className)}
    {...props}
  >
    {children}
  </div>
))

CardFooter.displayName = 'CardFooter'

/* ===============================================
   Specialized Card Components
   =============================================== */

export const GlassCard = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => <Card ref={ref} {...props} variant="glass" />
)

export const NeumorphCard = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => <Card ref={ref} {...props} variant="neumorph" />
)

export const GradientCard = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => <Card ref={ref} {...props} variant="gradient" />
)

export const InteractiveCard = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => <Card ref={ref} {...props} interactive hover="lift" />
)

/* ===============================================
   Feature Card
   =============================================== */

interface FeatureCardProps extends CardProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  badge?: string
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(({
  icon,
  title,
  description,
  action,
  badge,
  className,
  ...props
}, ref) => {
  return (
    <InteractiveCard
      ref={ref}
      className={cn('group', className)}
      {...props}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="group-hover:text-primary transition-colors">
                {title}
              </CardTitle>
              {badge && (
                <span className="inline-block mt-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="mt-3">
          {description}
        </CardDescription>
      </CardHeader>
      {action && (
        <CardFooter>
          {action}
        </CardFooter>
      )}
    </InteractiveCard>
  )
})

FeatureCard.displayName = 'FeatureCard'

/* ===============================================
   Stats Card
   =============================================== */

interface StatsCardProps extends CardProps {
  label: string
  value: string | number
  change?: {
    value: string | number
    trend: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(({
  label,
  value,
  change,
  icon,
  className,
  ...props
}, ref) => {
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-foreground-muted'
  }

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  }

  return (
    <Card
      ref={ref}
      className={cn('hover-lift', className)}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-foreground-muted font-medium">
              {label}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {value}
            </p>
            {change && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                trendColors[change.trend]
              )}>
                <span>{trendIcons[change.trend]}</span>
                <span>{change.value}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-foreground-muted">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

StatsCard.displayName = 'StatsCard'

/* ===============================================
   Floating Card
   =============================================== */

interface FloatingCardProps extends CardProps {
  floating?: boolean
  shadow?: 'sm' | 'md' | 'lg' | 'xl'
}

export const FloatingCard = React.forwardRef<HTMLDivElement, FloatingCardProps>(({
  children,
  className,
  floating = true,
  shadow = 'lg',
  ...props
}, ref) => {
  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  }

  return (
    <motion.div
      ref={ref}
      className={cn(
        'bg-card border border-border rounded-xl',
        shadowClasses[shadow],
        floating && 'animate-float',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: 'easeOut'
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

FloatingCard.displayName = 'FloatingCard'
