import { cn, initials, avatarUrl } from '@/utils/helpers';

interface Props {
  name: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };

export function Avatar({ name, avatar, size = 'md', className }: Props) {
  const url = avatarUrl(avatar);
  return url ? (
    <img
      src={url}
      alt={name}
      className={cn('rounded-full object-cover ring-2 ring-white dark:ring-gray-800', sizes[size], className)}
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-500 font-semibold text-white ring-2 ring-white dark:ring-gray-800',
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
