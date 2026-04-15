import { cn } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';

interface Props { className?: string; size?: 'sm' | 'md' | 'lg'; }

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export function Spinner({ className, size = 'md' }: Props) {
  return <Loader2 className={cn('animate-spin text-primary-500', sizes[size], className)} />;
}

export function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
