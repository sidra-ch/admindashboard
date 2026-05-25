'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiClient } from '../../../../lib/api-client';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8),
  licenseNumber: z.string().min(4),
  licenseExpiry: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', licenseExpiry: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        email: values.email || undefined,
        licenseExpiry: values.licenseExpiry || undefined,
      };
      const customer = await apiClient<{ id: string }>('/customers', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Customer created');
      router.push(`/dashboard/customers/${customer.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create customer');
    }
  });

  return (
    <Card>
      <CardHeader><CardTitle>Add Customer</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" {...form.register('firstName')} /></div>
          <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" {...form.register('lastName')} /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...form.register('email')} /></div>
          <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" {...form.register('phone')} /></div>
          <div className="space-y-2"><Label htmlFor="licenseNumber">License Number</Label><Input id="licenseNumber" {...form.register('licenseNumber')} /></div>
          <div className="space-y-2"><Label htmlFor="licenseExpiry">License Expiry</Label><Input id="licenseExpiry" type="date" {...form.register('licenseExpiry')} /></div>
          <div className="md:col-span-2"><Button type="submit">Create Customer</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
