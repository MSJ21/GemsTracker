import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/helpers';

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate          = useNavigate();
  const { setAuth, user } = useAuthStore();
  const [showPwd, setShowPwd]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [errorKey, setErrorKey] = useState(0);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormData) => {
    setApiError('');
    try {
      const res = await authApi.login(values);
      if (res.success) {
        setAuth(res.data.token, res.data.user);
        navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Login failed. Please try again.');
      setErrorKey(k => k + 1);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">

      {/* ── Full-screen background image ── */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80&auto=format&fit=crop"
          alt=""
          className="h-full w-full object-cover object-center"
          aria-hidden
        />
        {/* dark overlay so text stays legible */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-primary-950/75" />
        {/* animated colour tint blobs on top of the photo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-600/25 blur-[100px]" />
          <div className="animate-float-slow absolute -bottom-32 -left-16 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[110px]" />
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="animate-fade-up relative w-full max-w-[400px]">

        {/* Logo + heading */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="animate-glow-pulse relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 shadow-xl shadow-primary-500/50">
            <Zap className="h-7 w-7 text-white" strokeWidth={2.5} />
            <span
              className="absolute inset-[-3px] rounded-[18px] border border-primary-400/40"
              style={{ animation: 'spin 8s linear infinite' }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-white/60">
              Sign in to your <span className="font-semibold text-white/80">Gems Tracker</span> account
            </p>
          </div>
        </div>

        {/* ── Glass card ── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.07] shadow-2xl shadow-black/60 backdrop-blur-2xl">

          {/* top accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/70 to-transparent" />

          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>

              {/* ── Email ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={cn(
                    'h-11 w-full rounded-xl border px-4 text-sm text-white placeholder-white/25',
                    'bg-white/[0.07] transition-all duration-200',
                    'focus:outline-none focus:ring-2',
                    errors.email
                      ? 'border-red-400/50 bg-red-500/10 focus:ring-red-500/20'
                      : 'border-white/[0.12] hover:border-white/25 focus:border-primary-400/60 focus:bg-white/[0.11] focus:ring-primary-500/20'
                  )}
                />
                {errors.email && (
                  <p className="animate-slide-down flex items-center gap-1.5 text-xs text-red-300">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-red-400" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* ── Password ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={cn(
                      'h-11 w-full rounded-xl border px-4 pr-11 text-sm text-white placeholder-white/25',
                      'bg-white/[0.07] transition-all duration-200',
                      'focus:outline-none focus:ring-2',
                      errors.password
                        ? 'border-red-400/50 bg-red-500/10 focus:ring-red-500/20'
                        : 'border-white/[0.12] hover:border-white/25 focus:border-primary-400/60 focus:bg-white/[0.11] focus:ring-primary-500/20'
                    )}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-white/30 transition-colors hover:text-white/70"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="animate-slide-down flex items-center gap-1.5 text-xs text-red-300">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-red-400" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* ── API error ── */}
              {apiError && (
                <div
                  key={errorKey}
                  className="animate-shake flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-500/[0.12] px-4 py-3"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                  <p className="text-sm leading-snug text-red-200">{apiError}</p>
                </div>
              )}

              {/* ── Submit button ── */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'group relative mt-1 h-11 w-full overflow-hidden rounded-xl',
                  'bg-gradient-to-r from-primary-600 to-primary-500',
                  'text-sm font-semibold text-white',
                  'shadow-lg shadow-primary-500/40',
                  'transition-all duration-200 hover:shadow-primary-500/60 hover:shadow-xl',
                  'active:scale-[0.98]',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
                )}
              >
                {/* shimmer sweep */}
                <span className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20 transition-transform duration-700 group-hover:translate-x-[200%]" />
                <span className="relative flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </button>

            </form>
          </div>

          {/* bottom accent line */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>

        {/* Footer credit */}
        <p className="mt-5 text-center text-xs text-white/25">
          © {new Date().getFullYear()} Gemicates. All rights reserved.
        </p>
      </div>
    </div>
  );
}
