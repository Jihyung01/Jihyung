import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

// Page transition variants
const pageVariants = {
  // Slide transitions
  slideLeft: {
    initial: { opacity: 0, x: 300 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -300 }
  },
  slideRight: {
    initial: { opacity: 0, x: -300 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 300 }
  },
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  },
  slideDown: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  },
  
  // Scale transitions
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 }
  },
  scaleCenter: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  
  // Fade transitions
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  // Complex transitions
  slideScale: {
    initial: { opacity: 0, x: 50, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -50, scale: 0.95 }
  },
  spring: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 }
  }
}

// Transition configurations
const transitionConfigs = {
  fast: {
    type: "tween",
    duration: 0.15,
    ease: [0.4, 0, 0.2, 1]
  },
  medium: {
    type: "tween", 
    duration: 0.25,
    ease: [0.4, 0, 0.2, 1]
  },
  slow: {
    type: "tween",
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1]
  },
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 25
  },
  bounce: {
    type: "spring",
    stiffness: 300,
    damping: 20
  }
}

// Page transition component
export interface PageTransitionProps {
  children: React.ReactNode
  variant?: keyof typeof pageVariants
  speed?: keyof typeof transitionConfigs
  className?: string
  key?: string | number
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'slideScale',
  speed = 'medium',
  className,
  ...props
}) => {
  const variants = pageVariants[variant]
  const transition = transitionConfigs[speed]

  return (
    <motion.div
      key={props.key}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={transition}
      className={cn("w-full h-full", className)}
    >
      {children}
    </motion.div>
  )
}

// Page container with transition
export interface AnimatedPageProps extends PageTransitionProps {
  isVisible?: boolean
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  isVisible = true,
  ...props
}) => {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <PageTransition {...props}>
          {children}
        </PageTransition>
      )}
    </AnimatePresence>
  )
}

// List animation for staggered children
export interface ListAnimationProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
  variant?: 'fadeUp' | 'slideUp' | 'scale' | 'fade'
}

const listVariants = {
  fadeUp: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.05
        }
      }
    },
    item: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
    }
  },
  slideUp: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.08
        }
      }
    },
    item: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 }
    }
  },
  scale: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.06
        }
      }
    },
    item: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 }
    }
  },
  fade: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.04
        }
      }
    },
    item: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    }
  }
}

export const ListAnimation: React.FC<ListAnimationProps> = ({
  children,
  className,
  staggerDelay = 0.05,
  variant = 'fadeUp'
}) => {
  const variants = listVariants[variant]
  
  return (
    <motion.div
      variants={variants.container}
      initial="initial"
      animate="animate"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={variants.item}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Layout animation for dynamic layouts
export interface LayoutAnimationProps {
  children: React.ReactNode
  className?: string
  layoutId?: string
}

export const LayoutAnimation: React.FC<LayoutAnimationProps> = ({
  children,
  className,
  layoutId
}) => {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Skeleton loader with shimmer effect
export interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'none'
  width?: string | number
  height?: string | number
  lines?: number
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = 'rectangular',
  animation = 'wave',
  width,
  height,
  lines = 1
}) => {
  const baseClasses = cn(
    "bg-muted",
    {
      'rounded-full': variant === 'circular',
      'rounded-md': variant === 'rounded',
      'rounded-sm': variant === 'rectangular',
      'rounded': variant === 'text'
    },
    {
      'animate-pulse': animation === 'pulse',
      'animate-shimmer': animation === 'wave'
    },
    className
  )

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(baseClasses, "h-4")}
            style={{ 
              width: index === lines - 1 ? '70%' : '100%',
              height: height || '1rem'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={baseClasses}
      style={{ width, height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    />
  )
}

// Floating element animation
export interface FloatingElementProps {
  children: React.ReactNode
  className?: string
  delay?: number
  amplitude?: number
  duration?: number
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className,
  delay = 0,
  amplitude = 10,
  duration = 3
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-amplitude, amplitude, -amplitude]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    >
      {children}
    </motion.div>
  )
}

// Hover card animation
export interface HoverCardProps {
  children: React.ReactNode
  className?: string
  hoverScale?: number
  hoverY?: number
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  className,
  hoverScale = 1.02,
  hoverY = -4
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        scale: hoverScale, 
        y: hoverY,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}

// Stagger container for complex animations
export interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerDelay = 0.1,
  direction = 'up'
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 30 }
      case 'down': return { y: -30 }
      case 'left': return { x: 30 }
      case 'right': return { x: -30 }
      default: return { y: 30 }
    }
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { 
              opacity: 0, 
              ...getInitialPosition()
            },
            visible: { 
              opacity: 1, 
              x: 0, 
              y: 0,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
              }
            }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
