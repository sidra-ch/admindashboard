import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide', {
  variants: {
    variant: {
      default: 'border-border bg-secondary text-secondary-foreground',
      success: 'border-success/20 bg-success/10 text-success',
      warning: 'border-warning/20 bg-warning/10 text-warning',
      destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
      info: 'border-primary/20 bg-primary/10 text-primary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
