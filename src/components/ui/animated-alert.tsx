import * as React from 'react';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { cn } from '../../lib/utils';

interface AnimatedAlertProps {
  open: boolean;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

const positionClasses = {
  'top-right': 'fixed top-24 right-6',
  'top-center': 'fixed top-24 left-1/2 transform -translate-x-1/2',
  'top-left': 'fixed top-24 left-6',
  'bottom-right': 'fixed bottom-6 right-6',
  'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2',
  'bottom-left': 'fixed bottom-6 left-6',
};

export function AnimatedAlert({
  open,
  variant = 'default',
  title,
  message,
  onClose,
  duration = 3000,
  position = 'top-right'
}: AnimatedAlertProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setShouldRender(true);
      // Small delay to ensure the component is mounted before starting animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      
      // Auto-hide after duration
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    } else {
      setIsVisible(false);
      // Wait for exit animation to complete before unmounting
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!shouldRender) return null;

  return (
    <div 
      className={cn(
        positionClasses[position],
        'z-[100] w-96 transition-all duration-300 ease-out',
        isVisible 
          ? 'animate-in slide-in-from-right-5 fade-in zoom-in-95 opacity-100 translate-x-0' 
          : 'animate-out slide-out-to-right-5 fade-out zoom-out-95 opacity-0 translate-x-5'
      )}
    >
      <Alert variant={variant}>
        <AlertTitle>{title || (variant === 'destructive' ? '错误' : variant === 'success' ? '成功' : '提示')}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}