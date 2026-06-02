'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiClient } from '../../../../lib/api-client';
import { UserPlus, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const V = {
  card: '#18233D', surface: '#121A2F', border: 'rgba(255,255,255,0.08)',
  primary: '#4DA2FF', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8),
  licenseNumber: z.string().min(4),
  licenseExpiry: z.string().optional(),
});

type Values = z.infer<typeof schema>;

const inp: React.CSSProperties = {
  background: '#0E1728', border: `1px solid ${V.border}`, color: V.text,
  borderRadius: '10px', padding: '9px 13px', fontSize: '13px', width: '100%', outline: 'none',
};
const lbl: React.CSSProperties = {
  fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.10em', color: V.textMuted, display: 'block', marginBottom: '5px',
};

export default function NewCustomerPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', licenseExpiry: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError('');
    try {
      const payload = {
        ...values,
        email: values.email || undefined,
        licenseExpiry: values.licenseExpiry || undefined,
      };
      const customer = await apiClient<{ id: string }>('/customers', { method: 'POST', body: JSON.stringify(payload) });
      router.push(`/dashboard/customers/${customer.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create customer');
    }
  });

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }} className="space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/dashboard/customers">
          <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${V.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: V.textSec }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
          </button>
        </Link>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4DA2FF 0%, #006BCF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UserPlus style={{ width: '20px', height: '20px', color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ color: V.text, fontSize: '18px', fontWeight: 800 }}>Add Customer</h1>
          <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '2px' }}>Create a new customer record</p>
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={onSubmit}>
        <div style={{ background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={lbl}>First Name *</label>
              <input style={{ ...inp, ...(form.formState.errors.firstName ? { borderColor: V.danger } : {}) }} {...form.register('firstName')} placeholder="John" />
              {form.formState.errors.firstName && <p style={{ color: V.danger, fontSize: '11px', marginTop: '4px' }}>{form.formState.errors.firstName.message}</p>}
            </div>
            <div>
              <label style={lbl}>Last Name *</label>
              <input style={{ ...inp, ...(form.formState.errors.lastName ? { borderColor: V.danger } : {}) }} {...form.register('lastName')} placeholder="Smith" />
              {form.formState.errors.lastName && <p style={{ color: V.danger, fontSize: '11px', marginTop: '4px' }}>{form.formState.errors.lastName.message}</p>}
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input style={{ ...inp, ...(form.formState.errors.email ? { borderColor: V.danger } : {}) }} type="email" {...form.register('email')} placeholder="john@example.com" />
              {form.formState.errors.email && <p style={{ color: V.danger, fontSize: '11px', marginTop: '4px' }}>{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <label style={lbl}>Phone *</label>
              <input style={{ ...inp, ...(form.formState.errors.phone ? { borderColor: V.danger } : {}) }} {...form.register('phone')} placeholder="+61 400 000 000" />
              {form.formState.errors.phone && <p style={{ color: V.danger, fontSize: '11px', marginTop: '4px' }}>{form.formState.errors.phone.message}</p>}
            </div>
            <div>
              <label style={lbl}>License Number *</label>
              <input style={{ ...inp, ...(form.formState.errors.licenseNumber ? { borderColor: V.danger } : {}) }} {...form.register('licenseNumber')} placeholder="12345678" />
              {form.formState.errors.licenseNumber && <p style={{ color: V.danger, fontSize: '11px', marginTop: '4px' }}>{form.formState.errors.licenseNumber.message}</p>}
            </div>
            <div>
              <label style={lbl}>License Expiry</label>
              <input style={inp} type="date" {...form.register('licenseExpiry')} />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,90,111,0.10)', border: '1px solid rgba(255,90,111,0.22)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertTriangle style={{ width: '14px', height: '14px', color: V.danger, flexShrink: 0 }} />
              <span style={{ color: V.danger, fontSize: '12px' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end' }}>
            <Link href="/dashboard/customers">
              <button type="button" style={{ padding: '10px 20px', borderRadius: '11px', border: `1px solid ${V.border}`, background: 'transparent', color: V.textSec, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              style={{ padding: '10px 24px', borderRadius: '11px', border: 'none', background: V.primary, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: form.formState.isSubmitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: form.formState.isSubmitting ? 0.7 : 1 }}
            >
              {form.formState.isSubmitting && <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />}
              {form.formState.isSubmitting ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
