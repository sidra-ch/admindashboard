'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { getApiUrl } from '../../lib/api-client';
import { setStoredSession } from '../../lib/auth-storage';

const V = { bg: '#0B1020', surface: '#121A2F', card: '#18233D', border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF', secondary: '#00D1FF', success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F', text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99' };

const loginSchema = z.object({ email: z.string().email('Enter a valid email address'), password: z.string().min(10, 'Password must be at least 10 characters') });
type LoginValues = z.infer<typeof loginSchema>;
type LoginResponse = { accessToken: string; refreshToken: string; user: { sub: string; tenantId: string; email: string; role: string } };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const body: LoginResponse = await res.json();
      if (!res.ok) throw new Error((body as any).message ?? 'Login failed');
      setStoredSession({ accessToken: body.accessToken, refreshToken: body.refreshToken, user: body.user });
      toast.success('Welcome back!');
      router.push(searchParams.get('redirect') ?? '/dashboard');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Login failed'); }
    finally { setIsLoading(false); }
  };

  const inp = (err: boolean): React.CSSProperties => ({ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', background: '#121A2F', border: `1px solid ${err ? V.danger : 'rgba(255,255,255,0.10)'}`, color: V.text, fontSize: '14px', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' });

  return (
    <motion.form onSubmit={handleSubmit(onSubmit)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ color: V.textSec, fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Email Address</label>
        <div style={{ position: 'relative' }}>
          <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: V.textMuted, pointerEvents: 'none' }} />
          <input {...register('email')} type="email" placeholder="admin@company.com" autoComplete="email" style={inp(!!errors.email)} />
        </div>
        {errors.email && <p style={{ color: V.danger, fontSize: '11.5px', marginTop: '5px' }}>{errors.email.message}</p>}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ color: V.textSec, fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Password</label>
          <Link href="/auth/forgot-password" style={{ color: V.primary, fontSize: '12px', fontWeight: 500, textDecoration: 'none' }}>Forgot password?</Link>
        </div>
        <div style={{ position: 'relative' }}>
          <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: V.textMuted, pointerEvents: 'none' }} />
          <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••••" autoComplete="current-password" style={{ ...inp(!!errors.password), paddingRight: '44px' }} />
          <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: V.textMuted, display: 'flex', alignItems: 'center', padding: '4px' }}>
            {showPassword ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
          </button>
        </div>
        {errors.password && <p style={{ color: V.danger, fontSize: '11.5px', marginTop: '5px' }}>{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '13px', borderRadius: '12px', background: isLoading ? 'rgba(77,162,255,0.50)' : 'linear-gradient(135deg, #4DA2FF, #00D1FF)', border: 'none', color: 'white', fontWeight: 700, fontSize: '14px', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: isLoading ? 'none' : '0 6px 24px rgba(77,162,255,0.35)', transition: 'all 0.2s ease', marginTop: '4px' }}>
        {isLoading ? 'Authenticating...' : <><span>Sign In to Velocity Fleet OS</span><ArrowRight style={{ width: '15px', height: '15px' }} /></>}
      </button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', borderRadius: '11px', background: 'rgba(77,162,255,0.07)', border: '1px solid rgba(77,162,255,0.15)' }}>
        <Shield style={{ width: '14px', height: '14px', color: V.primary, flexShrink: 0, marginTop: '1px' }} />
        <p style={{ color: V.textSec, fontSize: '11.5px', lineHeight: 1.5 }}>Demo: <span style={{ color: V.primary, fontWeight: 600 }}>admin@fleetrentpro.com</span> · <span style={{ color: V.primary, fontWeight: 600 }}>Admin@12345</span></p>
      </div>
    </motion.form>
  );
}