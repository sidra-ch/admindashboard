import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { AvailabilityCheckResult } from '../types/calendar';

interface CheckAvailabilityParams {
  carId: string;
  startAt: string;
  endAt: string;
  excludeBookingId?: string;
  excludeRentalId?: string;
}

export function useAvailabilityCheck() {
  return useMutation({
    mutationFn: async (params: CheckAvailabilityParams) => {
      const { carId, ...body } = params;
      return apiClient<AvailabilityCheckResult>(`/cars/${carId}/check-availability`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
  });
}
