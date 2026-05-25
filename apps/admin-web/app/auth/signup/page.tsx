'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, Lock, Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const schema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  company: z.string().min(2, 'Company name required'),
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(10, 'Minimum 10 characters'),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((v) => v === true, 'You must accept the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type Values = z.infer<typeof schema>;

const cardStyle: React.CSSProperties = {
  background: 'oklch(0.115 0.020 265 / 0.92)',
  border: '1px solid oklch(0.275 0.022 265 / 0.8)',
  borderRadius: '1.5rem',
  boxShadow: '0 0 0 1px oklch(0.688 0.196 256 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.04), 0 40px 100px oklch(0 0 0 / 0.4)',
  backdropFilter: 'blur(24px)',
};

const inputStyle: React.CSSProperties = {
  background: 'oklch(0.155 0.018 265 / 0.80)',
  border: '1px solid oklch(0.265 0.018 265)',
  borderRadius: '0.75rem',
  color: 'oklch(0.94 0.006 255)',
  padding: '0.72rem 1rem',
  width: '100%',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function Field({ label, icon: Icon, error, children }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'oklch(0.58 0.010 265)' }}>
        <Icon className="size-3" />
        {label}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: 'oklch(0.70 0.18 25)' }}>{error}</p>}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'oklch(0.548 0.130 256)';
    e.currentTarget.style.boxShadow = '0 0 0 3px oklch(0.688 0.196 256 / 0.10)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'oklch(0.265 0.018 265)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const onSubmit = form.handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Account created! Redirecting to verification...');
    router.push('/auth/otp?context=signup');
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-6 py-10">
      <div className="w-full max-w-[460px]">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center rounded-xl text-base shadow-lg"
            style={{
              background: 'linear-gradient(135deg, oklch(0.688 0.196 256) 0%, oklch(0.55 0.22 275) 100%)',
              boxShadow: '0 6px 24px oklch(0.688 0.196 256 / 0.30)',
            }}
          >
            🚗
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: 'oklch(0.88 0.006 255)' }}>
              Velocity Fleet OS
            </p>
            <p className="text-[0.62rem] uppercase tracking-[0.18em]" style={{ color: 'oklch(0.42 0.010 265)' }}>
              Enterprise Command Centre
            </p>
          </div>
        </div>

        <div style={cardStyle} className="animate-auth-in p-7 sm:p-8">
          {/* Back link */}
          <Link
            href="/auth/login"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'oklch(0.54 0.010 265)' }}
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>

          {/* Progress steps */}
          <div className="mb-6 flex items-center gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="flex-1 rounded-full transition-all duration-500"
                style={{
                  height: '3px',
                  background: step >= s
                    ? 'linear-gradient(90deg, oklch(0.688 0.196 256), oklch(0.60 0.18 210))'
                    : 'oklch(0.248 0.020 265)',
                }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="mb-6">
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.67rem] font-semibold uppercase tracking-[0.20em]"
              style={{
                background: 'oklch(0.688 0.196 256 / 0.12)',
                border: '1px solid oklch(0.688 0.196 256 / 0.22)',
                color: 'oklch(0.80 0.10 256)',
              }}
            >
              Step {step} of 2
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'oklch(0.96 0.006 255)' }}>
              {step === 1 ? 'Create your account' : 'Secure your account'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'oklch(0.50 0.010 265)' }}>
              {step === 1
                ? 'Set up your enterprise workspace in 2 minutes'
                : 'Choose a strong password to protect your fleet operations'}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" icon={User} error={form.formState.errors.firstName?.message}>
                    <input type="text" placeholder="Alex" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} {...form.register('firstName')} />
                  </Field>
                  <Field label="Last name" icon={User} error={form.formState.errors.lastName?.message}>
                    <input type="text" placeholder="Chen" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} {...form.register('lastName')} />
                  </Field>
                </div>
                <Field label="Company name" icon={Building2} error={form.formState.errors.company?.message}>
                  <input type="text" placeholder="Apex Mobility Pty Ltd" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} {...form.register('company')} />
                </Field>
                <Field label="Work email" icon={Mail} error={form.formState.errors.email?.message}>
                  <input type="email" placeholder="alex@company.com.au" autoComplete="email" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} {...form.register('email')} />
                </Field>
                <button
                  type="button"
                  onClick={() => {
                    const fields: Array<keyof Values> = ['firstName', 'lastName', 'company', 'email'];
                    form.trigger(fields).then((valid) => { if (valid) setStep(2); });
                  }}
                  className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all hover:scale-[1.01] hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.688 0.196 256) 0%, oklch(0.58 0.22 270) 100%)',
                    color: 'oklch(0.98 0 0)',
                    boxShadow: '0 4px 24px oklch(0.688 0.196 256 / 0.28)',
                  }}
                >
                  Continue →
                </button>
              </>
            ) : (
              <>
                <Field label="Password" icon={Lock} error={form.formState.errors.password?.message}>
                  <input type="password" placeholder="Min. 10 characters" autoComplete="new-password" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} {...form.register('password')} />
                </Field>
                <Field label="Confirm password" icon={Lock} error={form.formState.errors.confirmPassword?.message}>
                  <input type="password" placeholder="Repeat password" autoComplete="new-password" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} {...form.register('confirmPassword')} />
                </Field>

                <div className="flex items-start gap-2">
                  <input
                    id="terms"
                    type="checkbox"
                    className="mt-0.5 size-3.5 cursor-pointer rounded"
                    style={{ accentColor: 'oklch(0.688 0.196 256)' }}
                    {...form.register('agreeTerms')}
                  />
                  <label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed" style={{ color: 'oklch(0.50 0.010 265)' }}>
                    I agree to the{' '}
                    <span style={{ color: 'oklch(0.688 0.196 256)' }}>Terms of Service</span>{' '}
                    and{' '}
                    <span style={{ color: 'oklch(0.688 0.196 256)' }}>Privacy Policy</span>.
                    Your data is stored in AU-East region.
                  </label>
                </div>
                {form.formState.errors.agreeTerms && (
                  <p className="text-xs" style={{ color: 'oklch(0.70 0.18 25)' }}>
                    {form.formState.errors.agreeTerms.message}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl py-3 text-sm font-medium transition-all hover:opacity-80"
                    style={{
                      background: 'oklch(0.188 0.018 265)',
                      border: '1px solid oklch(0.265 0.018 265)',
                      color: 'oklch(0.72 0.008 265)',
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="rounded-xl py-3 text-sm font-bold tracking-wide transition-all hover:scale-[1.01] disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.688 0.196 256) 0%, oklch(0.58 0.22 270) 100%)',
                      color: 'oklch(0.98 0 0)',
                      boxShadow: '0 4px 24px oklch(0.688 0.196 256 / 0.25)',
                    }}
                  >
                    {form.formState.isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating...
                      </span>
                    ) : (
                      'Create account'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-5 text-center text-xs" style={{ color: 'oklch(0.44 0.008 265)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold transition-opacity hover:opacity-80" style={{ color: 'oklch(0.688 0.196 256)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
