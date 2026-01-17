import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300';

    const variants = {
      default:
        'bg-slate-900 text-slate-50 hover:bg-slate-800 focus-visible:ring-slate-950 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-slate-300',
      destructive:
        'bg-red-500 text-slate-50 hover:bg-red-600 focus-visible:ring-red-500 dark:hover:bg-red-600',
      outline:
        'border border-slate-200 bg-white hover:bg-slate-100 text-slate-900 focus-visible:ring-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-50 dark:focus-visible:ring-slate-300',
      secondary:
        'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700',
      ghost:
        'hover:bg-slate-100 text-slate-900 focus-visible:ring-slate-500 dark:hover:bg-slate-800 dark:text-slate-50 dark:focus-visible:ring-slate-300',
      link: 'text-slate-900 underline-offset-4 hover:underline focus-visible:ring-slate-500 dark:text-slate-50 dark:focus-visible:ring-slate-300'
    };

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-9 rounded-md px-3 text-xs',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10'
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
