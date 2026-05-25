'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingFormWithAvailability } from '../../../../../components/rentals/booking-form-with-availability';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { useRouter } from 'next/navigation';

function NewBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCarId = searchParams.get('carId');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Booking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Check availability and create a booking
          </p>
        </div>
      </div>

      <BookingFormWithAvailability preselectedCarId={preselectedCarId || undefined} />
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewBookingContent />
    </Suspense>
  );
}
