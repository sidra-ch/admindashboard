'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { formatCurrency, formatDateTime } from '../../../../lib/formatters';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

export default function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const rentalQuery = useQuery({
    queryKey: ['rental', resolvedParams.id],
    queryFn: () => apiClient<any>(`/rentals/${resolvedParams.id}`),
  });

  if (rentalQuery.isLoading) return <div className="glass-panel rounded-[2rem] border p-8 text-sm text-muted-foreground">Loading rental...</div>;
  if (rentalQuery.isError || !rentalQuery.data) return <div className="glass-panel rounded-[2rem] border p-8 text-sm text-destructive">Unable to load rental.</div>;

  const rental = rentalQuery.data;
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card>
        <CardHeader><CardTitle>Rental Workflow</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">{rental.customer.firstName} {rental.customer.lastName}</p>
          <p>{rental.car.make} {rental.car.model} · {rental.car.registrationNumber}</p>
          <p>Pickup {formatDateTime(rental.pickupAt)}</p>
          <p>Expected return {formatDateTime(rental.expectedReturnAt)}</p>
          <p>Balance due {formatCurrency(rental.balanceDueCents)}</p>
          <Badge variant={rental.status === 'ACTIVE' ? 'info' : rental.status === 'COMPLETED' ? 'success' : 'warning'}>{rental.status}</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Commercial Ledger</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rental.invoice ? (
            <div className="rounded-2xl border border-border/70 p-4 text-sm">
              <p className="font-medium">Invoice {rental.invoice.invoiceNumber}</p>
              <p className="text-muted-foreground">{formatCurrency(rental.invoice.totalAmountCents)} · {rental.invoice.status}</p>
            </div>
          ) : null}
          {rental.payments.map((payment: any) => (
            <div key={payment.id} className="rounded-2xl border border-border/70 p-4 text-sm">
              <p className="font-medium">{formatCurrency(payment.amountCents)}</p>
              <p className="text-muted-foreground">{payment.method} · {payment.status} · {formatDateTime(payment.createdAt)}</p>
            </div>
          ))}
          {rental.extensions.map((extension: any) => (
            <div key={extension.id} className="rounded-2xl border border-border/70 p-4 text-sm">
              <p className="font-medium">Extension</p>
              <p className="text-muted-foreground">New return {formatDateTime(extension.newReturnAt)} · {formatCurrency(extension.additionalAmountCents)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
