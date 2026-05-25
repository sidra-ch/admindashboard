'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getStoredSession } from '@/lib/auth-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const MAINTENANCE_TYPES = [
  { value: 'ROUTINE_SERVICE', label: 'Routine Service' },
  { value: 'TYRE_REPLACEMENT', label: 'Tyre Replacement' },
  { value: 'BRAKE_SERVICE', label: 'Brake Service' },
  { value: 'ENGINE_REPAIR', label: 'Engine Repair' },
  { value: 'BODY_REPAIR', label: 'Body Repair' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'OTHER', label: 'Other' },
];

export default function NewMaintenanceJobPage() {
  const router = useRouter();
  const session = getStoredSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: carsData } = useQuery({
    queryKey: ['cars-list'],
    queryFn: () => apiClient<{ items: Car[] }>('/cars?pageSize=200'),
    enabled: !!session?.accessToken,
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = {
      carId: fd.get('carId'),
      type: fd.get('type'),
      description: fd.get('description') || undefined,
      odometerKm: fd.get('odometerKm') ? Number(fd.get('odometerKm')) : undefined,
      scheduledAt: fd.get('scheduledAt'),
      costCents: fd.get('costCents') ? Math.round(Number(fd.get('costCents')) * 100) : undefined,
      vendor: fd.get('vendor') || undefined,
      notes: fd.get('notes') || undefined,
    };
    try {
      await apiClient('/maintenance', { method: 'POST', body: JSON.stringify(body) });
      router.push('/dashboard/maintenance');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
      setSaving(false);
    }
  }

  const cars = carsData?.items ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/maintenance"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Schedule Maintenance Job</h1>
          <p className="text-sm text-muted-foreground">Add a new service or repair job to the schedule</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Wrench className="h-5 w-5" />
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carId">Vehicle *</Label>
                <select name="carId" id="carId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select vehicle...</option>
                  {cars.map((c: Car) => (
                    <option key={c.id} value={c.id}>{c.make} {c.model} — {c.registrationNumber}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Job Type *</Label>
                <select name="type" id="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select type...</option>
                  {MAINTENANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Scheduled Date *</Label>
                <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odometerKm">Odometer (km)</Label>
                <Input id="odometerKm" name="odometerKm" type="number" min="0" placeholder="e.g. 25000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor / Workshop</Label>
                <Input id="vendor" name="vendor" placeholder="e.g. Bob's Auto Service" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costCents">Estimated Cost (AUD)</Label>
                <Input id="costCents" name="costCents" type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Brief description of work required" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" placeholder="Additional notes..." />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Schedule Job'}</Button>
              <Link href="/dashboard/maintenance"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

type Car = { id: string; make: string; model: string; registrationNumber: string };
