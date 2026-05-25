'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { getStoredSession } from '@/lib/auth-storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, ArrowLeft, Calendar, DollarSign, Car, MapPin } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

const TYPE_LABELS: Record<string, string> = {
  ROUTINE_SERVICE: 'Routine Service',
  TYRE_REPLACEMENT: 'Tyre Replacement',
  BRAKE_SERVICE: 'Brake Service',
  ENGINE_REPAIR: 'Engine Repair',
  BODY_REPAIR: 'Body Repair',
  ELECTRICAL: 'Electrical',
  OTHER: 'Other',
};

const STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function MaintenanceJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const session = getStoredSession();
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => apiClient<MaintenanceJob>(`/maintenance/${id}`),
    enabled: !!session?.accessToken,
  });

  async function handleStatusUpdate() {
    if (!newStatus || !job) return;
    setUpdating(true);
    try {
      await apiClient(`/maintenance/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
        }),
      });
      await qc.invalidateQueries({ queryKey: ['maintenance'] });
      router.push('/dashboard/maintenance');
    } catch {
      setUpdating(false);
    }
  }

  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground">Loading...</div>;
  if (!job) return <div className="flex justify-center py-20 text-muted-foreground">Job not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/maintenance"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">{TYPE_LABELS[job.type] ?? job.type}</h1>
          <p className="text-sm text-muted-foreground">Maintenance Job #{id.slice(0, 8)}</p>
        </div>
        <Badge className={`ml-auto ${STATUS_COLORS[job.status] ?? ''}`}>{job.status.replace('_', ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{job.car?.make} {job.car?.model} ({job.car?.year})</p>
            <p className="text-sm text-muted-foreground">{job.car?.registrationNumber}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">Scheduled: {new Date(job.scheduledAt).toLocaleDateString('en-AU', { dateStyle: 'medium' })}</p>
            {job.completedAt && (
              <p className="text-sm text-muted-foreground">Completed: {new Date(job.completedAt).toLocaleDateString('en-AU', { dateStyle: 'medium' })}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${((job.costCents ?? 0) / 100).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">AUD</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{job.vendor ?? '—'}</p>
            {job.odometerKm && <p className="text-sm text-muted-foreground">Odometer: {job.odometerKm.toLocaleString()} km</p>}
          </CardContent>
        </Card>
      </div>

      {(job.description || job.notes) && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {job.description && (
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label><p className="mt-1">{job.description}</p></div>
            )}
            {job.notes && (
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wide">Notes</Label><p className="mt-1">{job.notes}</p></div>
            )}
          </CardContent>
        </Card>
      )}

      {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Wrench className="h-4 w-4" />
            <CardTitle className="text-sm">Update Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Select onValueChange={setNewStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select new status..." />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.filter((s) => s !== job.status).map((s) => (
                  <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleStatusUpdate} disabled={!newStatus || updating}>
              {updating ? 'Saving...' : 'Update'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type MaintenanceJob = {
  id: string;
  type: string;
  status: string;
  description: string | null;
  odometerKm: number | null;
  scheduledAt: string;
  completedAt: string | null;
  costCents: number;
  vendor: string | null;
  notes: string | null;
  car: { make: string; model: string; year: number; registrationNumber: string } | null;
};
