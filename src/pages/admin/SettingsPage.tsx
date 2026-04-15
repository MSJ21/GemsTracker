import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, Upload, Globe, Image, Save, RefreshCw, X, Tag, Plus, GripVertical, Mail, CheckCircle, AlertCircle, Send, Eye, EyeOff } from 'lucide-react';
import { settingsApi, type SiteSettings } from '@/api/settings';
import type { MailSettings } from '@/api/settings';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { avatarUrl } from '@/utils/helpers';

const DEFAULT_STATUSES = ['pending', 'in-progress', 'done'];

function CustomStatusesCard() {
  const push = useToastStore(s => s.push);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [loaded, setLoaded]     = useState(false);

  // Load from settings key 'task_statuses'
  useEffect(() => {
    settingsApi.public()
      .then(r => {
        try {
          const val = (r.data as SiteSettings & Record<string, string>)?.task_statuses;
          setStatuses(val ? JSON.parse(val) : DEFAULT_STATUSES);
        } catch {
          setStatuses(DEFAULT_STATUSES);
        }
        setLoaded(true);
      })
      .catch(() => { setStatuses(DEFAULT_STATUSES); setLoaded(true); });
  }, []);

  const save = () => {
    const form = new FormData();
    form.append('task_statuses', JSON.stringify(statuses));
    settingsApi.update(form)
      .then(() => push('Task statuses saved', 'success'))
      .catch(() => push('Failed to save', 'error'));
  };

  const add = () => {
    const label = newLabel.trim().toLowerCase().replace(/\s+/g, '-');
    if (!label || statuses.includes(label)) return;
    setStatuses(s => [...s, label]);
    setNewLabel('');
  };

  const remove = (s: string) => {
    if (DEFAULT_STATUSES.includes(s)) return; // protect core statuses
    setStatuses(prev => prev.filter(x => x !== s));
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-400" />
          Task Status Labels
        </CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <p className="text-xs text-slate-400">
          Define the task statuses available across the app. The three default statuses (<code>pending</code>, <code>in-progress</code>, <code>done</code>) cannot be removed.
        </p>
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => (
            <div key={s} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 pl-3 pr-2 py-1 dark:border-slate-700 dark:bg-slate-800">
              <GripVertical className="h-3 w-3 text-slate-300" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{s}</span>
              {!DEFAULT_STATUSES.includes(s) && (
                <button onClick={() => remove(s)}
                  className="ml-0.5 rounded-full p-0.5 text-slate-300 hover:text-red-500 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="New status label (e.g. review)"
            className="h-9 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <Button variant="outline" size="sm" onClick={add} disabled={!newLabel.trim()}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
          <Button size="sm" onClick={save}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function MailSettingsCard() {
  const push = useToastStore(s => s.push);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState<Partial<MailSettings> & { mail_pass?: string }>({});
  const [loaded, setLoaded] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['admin-mail-settings'],
    queryFn:  () => settingsApi.getMail().then(r => r.data),
  });

  useEffect(() => {
    if (data && !loaded) {
      setForm({
        mail_host:      data.mail_host,
        mail_port:      data.mail_port,
        mail_user:      data.mail_user,
        mail_from:      data.mail_from,
        mail_from_name: data.mail_from_name,
        app_url:        data.app_url,
        mail_pass:      '',
      });
      setLoaded(true);
    }
  }, [data, loaded]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const saveMut = useMutation({
    mutationFn: () => settingsApi.updateMail(form),
    onSuccess:  () => { refetch(); push('Mail settings saved', 'success'); },
    onError:    () => push('Failed to save mail settings', 'error'),
  });

  const testMut = useMutation({
    mutationFn: () => settingsApi.testMail(),
    onSuccess:  (r) => push((r as { message?: string })?.message ?? 'Test email sent', 'success'),
    onError:    (e: unknown) => push((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Send failed', 'error'),
  });

  const configured = data?.mail_configured ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          Email / SMTP Settings
          {configured
            ? <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="h-3 w-3" /> Configured</span>
            : <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><AlertCircle className="h-3 w-3" /> Not configured</span>}
        </CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <p className="text-xs text-slate-400">
          Configure Outlook / Office 365 SMTP to send invite emails to new users automatically.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SMTP Host</label>
            <input value={form.mail_host ?? ''} onChange={set('mail_host')}
              placeholder="smtp.office365.com"
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Port</label>
            <input value={form.mail_port ?? ''} onChange={set('mail_port')}
              placeholder="587"
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Username / Email</label>
            <input value={form.mail_user ?? ''} onChange={set('mail_user')}
              placeholder="your@outlook.com"
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password {configured && <span className="font-normal text-slate-400">(leave blank to keep)</span>}</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.mail_pass ?? ''} onChange={set('mail_pass')}
                placeholder={configured ? '••••••••' : 'App password'}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">From Address</label>
            <input value={form.mail_from ?? ''} onChange={set('mail_from')}
              placeholder="noreply@yourcompany.com"
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">From Name</label>
            <input value={form.mail_from_name ?? ''} onChange={set('mail_from_name')}
              placeholder="Gems Tracker"
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">App URL <span className="font-normal text-slate-400">(included in invite emails)</span></label>
          <input value={form.app_url ?? ''} onChange={set('app_url')}
            placeholder="https://yourcompany.com/tracker"
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => saveMut.mutate()} loading={saveMut.isPending}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          {configured && (
            <Button variant="outline" size="sm" onClick={() => testMut.mutate()} loading={testMut.isPending}>
              <Send className="h-3.5 w-3.5" /> Send test email to me
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const { setSiteSettings } = useSettingsStore();
  const push = useToastStore(s => s.push);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn:  () => settingsApi.get().then(r => r.data),
  });

  const [siteName, setSiteName]     = useState('');
  const [logoFile, setLogoFile]     = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      setSiteName(data.site_name ?? 'Gems Tracker');
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append('site_name', siteName.trim() || 'Gems Tracker');
      if (logoFile) form.append('site_logo', logoFile);
      if (removeLogo) form.append('remove_logo', '1');
      return settingsApi.update(form);
    },
    onSuccess: result => {
      const d = result.data;
      setSiteSettings(d?.site_name ?? siteName, d?.site_logo ?? '');
      setLogoFile(null);
      setLogoPreview(null);
      setRemoveLogo(false);
      refetch();
      push('Settings saved successfully', 'success');
    },
    onError: () => {
      push('Failed to save settings', 'error');
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setRemoveLogo(false);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (isLoading) return <PageSpinner />;

  const currentLogo = logoPreview ?? (data?.site_logo ? avatarUrl(data.site_logo) : null);

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <Settings className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Master Settings</h2>
          <p className="text-sm text-slate-500">Configure site-wide branding and preferences</p>
        </div>
      </div>

      {/* Branding Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            Site Branding
          </CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          {/* Site Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Site Name
            </label>
            <Input
              value={siteName}
              onChange={e => setSiteName(e.target.value)}
              placeholder="Gems Tracker"
              maxLength={60}
            />
            <p className="text-xs text-slate-400">Displayed in the sidebar and browser tab.</p>
          </div>

          {/* Logo upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Site Logo
            </label>

            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {currentLogo && !removeLogo ? (
                  <>
                    <img
                      src={currentLogo}
                      alt="Site logo"
                      className="h-full w-full rounded-2xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); setRemoveLogo(true); if (fileRef.current) fileRef.current.value = ''; }}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <Image className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                )}
              </div>

              {/* Upload controls */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {currentLogo && !removeLogo ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-slate-400">PNG, JPG, WebP · max 2 MB<br />Recommended: 256 × 256 px</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-slate-400" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-3 rounded-xl bg-slate-950 px-4 py-3">
            {currentLogo && !removeLogo ? (
              <img src={currentLogo} alt="logo" className="h-9 w-9 rounded-xl object-cover" />
            ) : (
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30">
                <span className="text-sm font-bold text-white">{(siteName || 'P').charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="text-[15px] font-bold tracking-tight text-white">
              {siteName || 'Gems Tracker'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">This is how the logo and name appear in the sidebar.</p>
        </CardBody>
      </Card>

      {/* Custom Task Statuses */}
      <CustomStatusesCard />

      {/* Mail / SMTP */}
      <MailSettingsCard />

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
