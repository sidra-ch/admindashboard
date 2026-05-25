'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useState, useRef, KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const cardStyle: React.CSSProperties = {
  background: 'oklch(0.115 0.020 265 / 0.92)',
  border: '1px solid oklch(0.275 0.022 265 / 0.8)',
  borderRadius: '1.5rem',
  boxShadow: '0 0 0 1px oklch(0.688 0.196 256 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.04), 0 40px 100px oklch(0 0 0 / 0.4)',
  backdropFilter: 'blur(24px)',
};

function OtpInput({ length = 6, onChange }: { length?: number; onChange: (val: string) => void }) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const update = (idx: number, val: string) => {
    const next = [...digits];
    next[idx] = val.slice(-1);
    setDigits(next);
    onChange(next.join(''));
    if (val && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => update(i, e.target.value)}
          onKeyDown={(e) => onKey(e, i)}
          className="text-center text-xl font-bold transition-all duration-200 focus:scale-105"
          style={{
            width: '52px',
            height: '60px',
            background: d ? 'oklch(0.688 0.196 256 / 0.18)' : 'oklch(0.155 0.018 265 / 0.80)',
            border: d ? '1px solid oklch(0.688 0.196 256 / 0.55)' : '1px solid oklch(0.265 0.018 265)',
            borderRadius: '0.875rem',
            color: 'oklch(0.94 0.006 255)',
            outline: 'none',
            boxShadow: d ? '0 0 0 3px oklch(0.688 0.196 256 / 0.10)' : 'none',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'oklch(0.548 0.130 256)';
            e.currentTarget.style.boxShadow = '0 0 0 3px oklch(0.688 0.196 256 / 0.12)';
          }}
          onBlur={(e) => {
            if (!e.currentTarget.value) {
              e.currentTarget.style.borderColor = 'oklch(0.265 0.018 265)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        />
      ))}
    </div>
  );
}

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = searchParams.get('context') ?? 'login';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleVerify = async () => {
    if (otp.length < 6) {
      toast.error('Enter all 6 digits');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    if (otp === '000000') {
      toast.error('Invalid verification code');
      setLoading(false);
      return;
    }
    toast.success('Identity verified successfully!');
    router.push('/dashboard');
  };

  const handleResend = () => {
    toast.success('New verification code sent');
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
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
          <Link
            href="/auth/login"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'oklch(0.54 0.010 265)' }}
          >
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>

          {/* Header */}
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl"
              style={{
                background: 'oklch(0.688 0.196 256 / 0.12)',
                border: '1px solid oklch(0.688 0.196 256 / 0.25)',
              }}
            >
              <ShieldCheck className="size-7" style={{ color: 'oklch(0.688 0.196 256)' }} />
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'oklch(0.96 0.006 255)' }}>
              Verify your identity
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'oklch(0.50 0.010 265)' }}>
              {context === 'signup'
                ? "We've sent a 6-digit verification code to your work email"
                : 'Enter the 6-digit code from your authenticator app or email'}
            </p>
          </div>

          {/* OTP input */}
          <div className="mb-6">
            <OtpInput onChange={setOtp} />
          </div>

          {/* Security level indicator */}
          <div
            className="mb-6 flex items-center justify-center gap-2 rounded-xl p-3 text-xs"
            style={{
              background: 'oklch(0.688 0.196 256 / 0.08)',
              border: '1px solid oklch(0.688 0.196 256 / 0.18)',
              color: 'oklch(0.68 0.080 256)',
            }}
          >
            <span className="size-1.5 rounded-full bg-current animate-live-blink" />
            Secure end-to-end encrypted channel
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otp.length < 6}
            className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all hover:scale-[1.01] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, oklch(0.688 0.196 256) 0%, oklch(0.58 0.22 270) 100%)',
              color: 'oklch(0.98 0 0)',
              boxShadow: '0 4px 24px oklch(0.688 0.196 256 / 0.28)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Verifying...
              </span>
            ) : (
              'Verify & continue'
            )}
          </button>

          <p className="mt-5 text-center text-xs" style={{ color: 'oklch(0.44 0.008 265)' }}>
            Didn&apos;t receive the code?{' '}
            {resendTimer > 0 ? (
              <span style={{ color: 'oklch(0.52 0.010 265)' }}>
                Resend in {resendTimer}s
              </span>
            ) : (
              <button
                type="button"
                className="font-semibold transition-opacity hover:opacity-80"
                style={{ color: 'oklch(0.688 0.196 256)' }}
                onClick={handleResend}
              >
                Resend code
              </button>
            )}
          </p>

          <div
            className="mt-5 rounded-xl p-3 text-xs leading-relaxed"
            style={{
              background: 'oklch(0.155 0.018 265 / 0.60)',
              border: '1px solid oklch(0.248 0.018 265)',
              color: 'oklch(0.44 0.008 265)',
            }}
          >
            🔐 Codes expire after 10 minutes. For demo, enter any 6 digits (not 000000).
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OtpPage() {
  return (
    <Suspense>
      <OtpContent />
    </Suspense>
  );
}
