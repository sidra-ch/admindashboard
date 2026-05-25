'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { formatCurrency, formatDate, formatDateTime } from '../../../../lib/formatters';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerQuery = useQuery({
    queryKey: ['customer', resolvedParams.id],
    queryFn: () => apiClient<any>(`/customers/${resolvedParams.id}`),
  });

  if (customerQuery.isLoading) return <div className="glass-panel rounded-[2rem] border p-8 text-sm text-muted-foreground">Loading customer...</div>;
  if (customerQuery.isError || !customerQuery.data) return <div className="glass-panel rounded-[2rem] border p-8 text-sm text-destructive">Unable to load customer.</div>;

  const customer = customerQuery.data;
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <Card>
        <CardHeader><CardTitle>{customer.firstName} {customer.lastName}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{customer.email ?? 'No email'} · {customer.phone}</p>
          <p>{customer.licenseNumber} · expires {customer.licenseExpiry ? formatDate(customer.licenseExpiry) : 'Not set'}</p>
          <div className="flex gap-2">
            <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'default'}>{customer.status}</Badge>
            <Badge variant={customer.riskLevel === 'LOW' ? 'success' : customer.riskLevel === 'MEDIUM' ? 'warning' : 'destructive'}>{customer.riskLevel}</Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent Rentals</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {customer.rentals.map((rental: any) => (
            <div key={rental.id} className="rounded-2xl border border-border/70 p-4 text-sm">
              <p className="font-medium">{rental.car.make} {rental.car.model}</p>
              <p className="text-muted-foreground">{rental.status} · pickup {formatDateTime(rental.pickupAt)}</p>
              <p className="mt-1">Balance {formatCurrency(rental.balanceDueCents)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
