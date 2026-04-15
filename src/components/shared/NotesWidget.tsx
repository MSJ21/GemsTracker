import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pin, Trash2, Search, Check, Loader2 } from 'lucide-react';
import { notesApi } from '@/api/notes';
import type { NoteDto } from '@/api/notes';
import { cn } from '@/utils/helpers';

const COLORS: { key: string; bg: string; ring: string; dot: string }[] = [
  { key: 'yellow', bg: 'bg-amber-50 dark:bg-amber-900/20',    ring: 'ring-amber-200 dark:ring-amber-700/40',    dot: 'bg-amber-400'   },
  { key: 'blue',   bg: 'bg-sky-50 dark:bg-sky-900/20',        ring: 'ring-sky-200 dark:ring-sky-700/40',        dot: 'bg-sky-400'     },
  { key: 'green',  bg: 'bg-emerald-50 dark:bg-emerald-900/20',ring: 'ring-emerald-200 dark:ring-emerald-700/40',dot: 'bg-emerald-400' },
  { key: 'pink',   bg: 'bg-pink-50 dark:bg-pink-900/20',      ring: 'ring-pink-200 dark:ring-pink-700/40',      dot: 'bg-pink-400'    },
  { key: 'purple', bg: 'bg-violet-50 dark:bg-violet-900/20',  ring: 'ring-violet-200 dark:ring-violet-700/40',  dot: 'bg-violet-400'  },
  { key: 'gray',   bg: 'bg-slate-50 dark:bg-slate-800',       ring: 'ring-slate-200 dark:ring-slate-700',       dot: 'bg-slate-400'   },
];

function colorOf(key: string) {
  return COLORS.find(c => c.key === key) ?? COLORS[0]!;
}

function NoteCard({
  note,
  onSave,
  onDelete,
  onTogglePin,
  onColorChange,
}: {
  note: NoteDto;
  onSave: (id: number, title: string, content: string) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number, pinned: boolean) => void;
  onColorChange: (id: number, color: string) => void;
}) {
  const [editing, setEditing]     = useState(false);
  const [title, setTitle]         = useState(note.title);
  const [content, setContent]     = useState(note.content);
  const [showPalette, setShowPalette] = useState(false);
  const c = colorOf(note.color);

  const save = () => { onSave(note.id, title, content); setEditing(false); };
  const cancel = () => { setTitle(note.title); setContent(note.content); setEditing(false); };

  return (
    <div className={cn('group relative flex flex-col gap-2 rounded-xl p-4 ring-1 transition-all', c.bg, c.ring, note.is_pinned && 'shadow-md')}>
      {note.is_pinned && (
        <div className="absolute -top-1.5 left-3 flex h-3 w-3 items-center justify-center rounded-full bg-primary-500 shadow-sm">
          <Pin className="h-1.5 w-1.5 text-white" />
        </div>
      )}

      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title…"
          className="w-full rounded-lg border-0 bg-white/60 px-2 py-1 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 dark:bg-slate-700/60 dark:text-slate-100"
        />
      ) : (
        <button type="button" onDoubleClick={() => setEditing(true)} className="text-left text-sm font-semibold text-slate-800 dark:text-slate-100 min-h-[1.25rem] truncate" title="Double-click to edit">
          {note.title || <span className="font-normal italic text-slate-400">Untitled</span>}
        </button>
      )}

      {editing ? (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') save(); }}
          rows={4}
          placeholder="Write your note…"
          className="w-full resize-none rounded-lg border-0 bg-white/60 px-2 py-1 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 dark:bg-slate-700/60 dark:text-slate-200"
        />
      ) : (
        <button type="button" onDoubleClick={() => setEditing(true)} className="text-left text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-5 min-h-[2rem] whitespace-pre-wrap" title="Double-click to edit">
          {note.content || <span className="italic text-slate-400">Empty note…</span>}
        </button>
      )}

      {editing && (
        <div className="flex justify-end gap-1.5">
          <button type="button" onClick={cancel} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-black/5">Cancel</button>
          <button type="button" onClick={save} className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700">
            <Check className="h-3 w-3" /> Save
          </button>
        </div>
      )}

      {!editing && (
        <div className="mt-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button type="button" onClick={() => setShowPalette(p => !p)} className={cn('h-4 w-4 rounded-full ring-2 ring-white dark:ring-slate-700', c.dot)} title="Change color" />
            {showPalette && (
              <div className="absolute bottom-6 left-0 z-10 flex gap-1 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                {COLORS.map(col => (
                  <button key={col.key} type="button" onClick={() => { onColorChange(note.id, col.key); setShowPalette(false); }}
                    className={cn('h-4 w-4 rounded-full transition-transform hover:scale-125', col.dot, note.color === col.key && 'ring-2 ring-offset-1 ring-primary-500')} title={col.key} />
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => onTogglePin(note.id, !note.is_pinned)} title={note.is_pinned ? 'Unpin' : 'Pin'}
              className={cn('rounded-lg p-1 transition-colors', note.is_pinned ? 'text-primary-500 hover:text-primary-700' : 'text-slate-400 hover:text-primary-500')}>
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => onDelete(note.id)} className="rounded-lg p-1 text-slate-400 transition-colors hover:text-red-500" title="Delete note">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function NotesWidget() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesApi.list().then(r => r.data ?? []),
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['notes'] });

  const createMutation = useMutation({
    mutationFn: () => notesApi.create({ title: '', content: '', color: 'yellow', is_pinned: false }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: number; payload: Partial<NoteDto> }) => notesApi.update(args.id, args.payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: invalidate,
  });

  const filtered = notes.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const pinned   = filtered.filter(n => n.is_pinned);
  const unpinned = filtered.filter(n => !n.is_pinned);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notes</h3>
          {notes.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{notes.length}</span>
          )}
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        </div>
        <div className="flex items-center gap-2">
          {notes.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes…"
                className="h-7 w-32 rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex items-center gap-1 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> New Note
          </button>
        </div>
      </div>

      {pinned.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Pin className="h-3 w-3" /> Pinned
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pinned.map(n => (
              <NoteCard key={n.id} note={n}
                onSave={(id, t, c) => updateMutation.mutate({ id, payload: { title: t, content: c } })}
                onDelete={id => deleteMutation.mutate(id)}
                onTogglePin={(id, p) => updateMutation.mutate({ id, payload: { is_pinned: p } })}
                onColorChange={(id, color) => updateMutation.mutate({ id, payload: { color } })}
              />
            ))}
          </div>
        </div>
      )}

      {unpinned.length > 0 && (
        <div className="flex flex-col gap-2">
          {pinned.length > 0 && <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Other</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unpinned.map(n => (
              <NoteCard key={n.id} note={n}
                onSave={(id, t, c) => updateMutation.mutate({ id, payload: { title: t, content: c } })}
                onDelete={id => deleteMutation.mutate(id)}
                onTogglePin={(id, p) => updateMutation.mutate({ id, payload: { is_pinned: p } })}
                onColorChange={(id, color) => updateMutation.mutate({ id, payload: { color } })}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {search ? 'No notes match your search' : 'No notes yet'}
          </p>
          {!search && <p className="text-xs text-slate-400">Click "New Note" to create your first note</p>}
        </div>
      )}
    </div>
  );
}
