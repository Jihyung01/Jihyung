// src/components/ui/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'default'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', loading = false, disabled, onClick, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md cursor-pointer"
    
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    }
    
    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 py-2", 
      lg: "h-11 px-8",
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      console.log('Button handleClick called!', { 
        disabled, 
        loading, 
        hasOnClick: !!onClick,
        event: e.type,
        target: e.target
      })
      
      if (!disabled && !loading && onClick) {
        try {
          onClick(e)
        } catch (error) {
          console.error('Error in onClick handler:', error)
        }
      } else {
        console.log('Click blocked:', { disabled, loading, hasOnClick: !!onClick })
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        onClick={handleClick}
        style={{ pointerEvents: (disabled || loading) ? 'none' : 'auto' }}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Loading...
          </div>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'