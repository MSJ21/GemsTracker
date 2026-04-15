import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogApi, type AuditLog } from '@/api/auditlog';
import { ScrollText, Search } from 'lucide-react';
import { timeAgo } from '@/utils/helpers';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  login:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function getColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k));
  return key ? ACTION_COLORS[key] : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
}

function entityLabel(log: AuditLog) {
  if (!log.entity) return '—';
  return log.entity_id ? `${log.entity} #${log.entity_id}` : log.entity;
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => auditLogApi.list({ limit: 200 }).then(r => r.data ?? []),
  });

  const logs: AuditLog[] = data;
  const filtered = logs.filter(l =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity?.toLowerCase().includes(search.toLowerCase())
  );

  function renderBody() {
    if (isLoading) {
      return <div className="text-center py-12 text-slate-500">Loading...</div>;
    }
    if (filtered.length === 0) {
      return (
        <div className="text-center py-16">
          <ScrollText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No audit log entries found.</p>
        </div>
      );
    }
    return (
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Action</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">User</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Entity</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">IP</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {filtered.map(log => (
            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getColor(log.action)}`}>
                  {log.action}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                {log.user_name ?? '—'}
                {log.user_email && (
                  <span className="block text-xs text-slate-400">{log.user_email}</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{entityLabel(log)}</td>
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.ip ?? '—'}</td>
              <td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(log.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">Track all changes across the system</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none w-56"
            placeholder="Search logs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        {renderBody()}
      </div>
    </div>
  );
}
