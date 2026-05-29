'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useState } from 'react';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success(`Recovery link sent to ${email}`);
    setSent(true);
  });

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
    padding: '0.75rem 1rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
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
          <p className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: 'oklch(0.88 0.006 255)' }}>
            Velocity Fleet OS
          </p>
        </div>

        <div style={cardStyle} className="animate-auth-in p-7 sm:p-8">
          {!sent ? (
            <>
              {/* Back link */}
              <Link
                href="/auth/login"
                className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: 'oklch(0.54 0.010 265)' }}
              >
                <ArrowLeft className="size-3.5" />
                Back to sign in
              </Link>

              {/* Header */}
              <div className="mb-6">
                <div
                  className="mb-4 flex size-12 items-center justify-center rounded-2xl"
                  style={{
                    background: 'oklch(0.688 0.196 256 / 0.12)',
                    border: '1px solid oklch(0.688 0.196 256 / 0.22)',
                  }}
                >
                  <ShieldCheck className="size-5" style={{ color: 'oklch(0.688 0.196 256)' }} />
                </div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'oklch(0.96 0.006 255)' }}>
                  Reset your access
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'oklch(0.52 0.010 265)' }}>
                  Enter your work email and we'll send a secure password reset link within 2 minutes.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{ color: 'oklch(0.58 0.010 265)' }}
                  >
                    <Mail className="size-3" />
                    Work email
                  </label>
                  <input
                    type="email"
                    placeholder="ops@company.com.au"
                    autoComplete="email"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(0.548 0.130 256)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px oklch(0.688 0.196 256 / 0.10)';
                    }}
                    {...form.register('email')}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'oklch(0.265 0.018 265)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs" style={{ color: 'oklch(0.70 0.18 25)' }}>
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all duration-200 hover:scale-[1.01] hover:shadow-2xl active:scale-[0.99] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.688 0.196 256) 0%, oklch(0.58 0.22 270) 100%)',
                    color: 'oklch(0.98 0 0)',
                    boxShadow: '0 4px 24px oklch(0.688 0.196 256 / 0.30)',
                  }}
                >
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending reset link...
                    </span>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <div
                className="mt-5 rounded-xl p-3 text-xs leading-relaxed"
                style={{
                  background: 'oklch(0.155 0.018 265 / 0.60)',
                  border: '1px solid oklch(0.248 0.018 265)',
                  color: 'oklch(0.48 0.008 265)',
                }}
              >
                🔒 Reset links expire after 15 minutes. Check your spam folder if not received.
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <div
                className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl text-2xl"
                style={{
                  background: 'oklch(0.72 0.152 145 / 0.14)',
                  border: '1px solid oklch(0.72 0.152 145 / 0.25)',
                }}
              >
                ✉️
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'oklch(0.96 0.006 255)' }}>
                Check your inbox
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'oklch(0.52 0.010 265)' }}>
                A secure reset link has been sent. It expires in 15 minutes.
              </p>
              <Link
                href="/auth/login"
                className="mt-6 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.688 0.196 256) 0%, oklch(0.58 0.22 270) 100%)',
                  color: 'oklch(0.98 0 0)',
                }}
              >
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
