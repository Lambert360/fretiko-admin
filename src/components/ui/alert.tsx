'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success: 'border-green-500/50 text-green-700 bg-green-50 [&>svg]:text-green-600',
        warning: 'border-yellow-500/50 text-yellow-700 bg-yellow-50 [&>svg]:text-yellow-600',
        info: 'border-blue-500/50 text-blue-700 bg-blue-50 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
}

function Alert({ className, variant, icon, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon}
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}

// Pre-configured alert types for common use cases
function InfoAlert({ children, className, ...props }: Omit<AlertProps, 'variant' | 'icon'>) {
  return (
    <Alert variant="info" icon={<Info className="h-4 w-4" />} className={className} {...props}>
      {children}
    </Alert>
  );
}

function SuccessAlert({ children, className, ...props }: Omit<AlertProps, 'variant' | 'icon'>) {
  return (
    <Alert variant="success" icon={<CheckCircle className="h-4 w-4" />} className={className} {...props}>
      {children}
    </Alert>
  );
}

function WarningAlert({ children, className, ...props }: Omit<AlertProps, 'variant' | 'icon'>) {
  return (
    <Alert variant="warning" icon={<AlertTriangle className="h-4 w-4" />} className={className} {...props}>
      {children}
    </Alert>
  );
}

function ErrorAlert({ children, className, ...props }: Omit<AlertProps, 'variant' | 'icon'>) {
  return (
    <Alert variant="destructive" icon={<XCircle className="h-4 w-4" />} className={className} {...props}>
      {children}
    </Alert>
  );
}

export { Alert, AlertTitle, AlertDescription, InfoAlert, SuccessAlert, WarningAlert, ErrorAlert };
