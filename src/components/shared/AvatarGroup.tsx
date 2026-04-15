import { cn, initials, avatarUrl } from '@/utils/helpers';

interface Person {
  id: number;
  name: string;
  avatar?: string | null;
}

interface Props {
  people: Person[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const sizes = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
};

const rings = {
  xs: 'ring-[1.5px]',
  sm: 'ring-2',
  md: 'ring-2',
};

export function AvatarGroup({ people, max = 4, size = 'sm', className }: Props) {
  const shown = people.slice(0, max);
  const extra = people.length - max;

  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((p, i) => {
        const url = avatarUrl(p.avatar);
        return url ? (
          <img
            key={p.id}
            src={url}
            alt={p.name}
            title={p.name}
            className={cn(
              'rounded-full object-cover ring-white dark:ring-slate-900',
              sizes[size],
              rings[size],
              i > 0 && '-ml-1.5',
            )}
          />
        ) : (
          <div
            key={p.id}
            title={p.name}
            className={cn(
              'flex items-center justify-center rounded-full font-semibold ring-white dark:ring-slate-900',
              'bg-gradient-to-br from-primary-400 to-violet-500 text-white',
              sizes[size],
              rings[size],
              i > 0 && '-ml-1.5',
            )}
          >
            {initials(p.name).slice(0, 1)}
          </div>
        );
      })}
      {extra > 0 && (
        <div
          title={`+${extra} more`}
          className={cn(
            'flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 ring-white dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-900',
            sizes[size],
            rings[size],
            '-ml-1.5',
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
