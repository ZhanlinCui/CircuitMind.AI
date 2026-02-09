import * as React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const alertVariants = {
  default: 'bg-background text-foreground',
  destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
  success: 'border-emerald-500/50 text-emerald-600 bg-emerald-50 [&>svg]:text-emerald-600',
  warning: 'border-amber-500/50 text-amber-600 bg-amber-50 [&>svg]:text-amber-600',
  info: 'border-blue-500/50 text-blue-600 bg-blue-50 [&>svg]:text-blue-600',
};

const icons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof alertVariants;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const Icon = icons[variant];
    const variantClass = alertVariants[variant] || alertVariants.default;

    return (
      <div
        ref={ref}
        role='alert'
        className={cn(
          'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground animate-in fade-in-0 zoom-in-95 duration-200',
          variantClass,
          className
        )}
        {...props}
      >
        <Icon className='h-4 w-4' />
        {children}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
