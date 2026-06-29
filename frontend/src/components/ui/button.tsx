import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-lg hover:brightness-110 hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]',
        destructive: 'bg-red-500/90 text-white hover:bg-red-500 hover:shadow-[0_0_20px_hsl(0,73%,60%,0.4)]',
        outline: 'border border-border bg-transparent hover:bg-muted/60 text-foreground',
        ghost: 'hover:bg-muted/60 text-muted-foreground hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-emerald-600/90 text-white hover:bg-emerald-600 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]',
        warning: 'bg-amber-500/90 text-black hover:bg-amber-500',
        gradient:
          'bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-lg hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-9 w-9 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
