'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../lib/api-client';
import { useAvailabilityCheck } from '../../hooks/use-availability-check';
import { ConflictWarningModal } from '../calendar/conflict-warning-modal';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface BookingFormProps {
  preselectedCarId?: string;
}

export function BookingFormWithAvailability({ preselectedCarId }: BookingFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    carId: preselectedCarId || '',
    customerId: '',
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [conflict, setConflict] = useState<any>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [nextAvailable, setNextAvailable] = useState<string | null>(null);

  // Fetch cars
  const { data: carsData } = useQuery({
    queryKey: ['cars'],
    queryFn: () => apiClient<any>('/cars?pageSize=100'),
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient<any>('/customers?pageSize=100'),
  });

  // Availability check mutation
  const { mutateAsync: checkAvailability, isPending: isCheckingAvailability } = useAvailabilityCheck();

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data: any) => apiClient('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('Booking created successfully!', {
        description: 'The booking has been added to the calendar.',
      });
      router.push('/dashboard/rentals/bookings');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create booking');
    },
  });

  const handleCheckAvailability = async () => {
    if (!formData.carId || !formData.startDate || !formData.endDate) {
      toast.error('Please select car and dates');
      return;
    }

    try {
      const result = await checkAvailability({
        carId: formData.carId,
        startAt: new Date(formData.startDate).toISOString(),
        endAt: new Date(formData.endDate).toISOString(),
      });

      setAvailabilityChecked(true);

      if (result.available) {
        setIsAvailable(true);
        setConflict(null);
        setNextAvailable(result.nextAvailableAfter || null);
        toast.success('Car is available!', {
          description: 'You can proceed with the booking.',
          icon: '✅',
        });
      } else {
        setIsAvailable(false);
        setConflict(result.conflict);
        setNextAvailable(result.nextAvailableAfter || null);
        setShowConflictModal(true);
      }
    } catch (error: any) {
      toast.error('Failed to check availability');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!availabilityChecked) {
      toast.error('Please check availability first');
      return;
    }

    if (!isAvailable) {
      toast.error('Car is not available for selected dates');
      return;
    }

    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    await createBookingMutation.mutateAsync({
      carId: formData.carId,
      customerId: formData.customerId,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      notes: formData.notes,
      status: 'CONFIRMED',
    });
  };

  const handleDateChange = () => {
    // Reset availability check when dates change
    setAvailabilityChecked(false);
    setIsAvailable(false);
    setConflict(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-border/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create New Booking
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Car Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="carId" className="text-sm font-medium">Select Car *</Label>
                <Select
                  value={formData.carId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, carId: value });
                    handleDateChange();
                  }}
                  disabled={!!preselectedCarId}
                >
                  <SelectTrigger className="transition-all hover:border-primary/50">
                    <SelectValue placeholder="Choose a car" />
                  </SelectTrigger>
                  <SelectContent>
                    {carsData?.items?.map((car: any) => (
                      <SelectItem key={car.id} value={car.id}>
                        {car.brand || car.make} {car.model} ({car.registrationNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Date Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                      handleDateChange();
                    }}
                    className="transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium">End Date *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => {
                      setFormData({ ...formData, endDate: e.target.value });
                      handleDateChange();
                    }}
                    className="transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </motion.div>

              {/* Availability Check Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full group relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-md"
                  onClick={handleCheckAvailability}
                  disabled={!formData.carId || !formData.startDate || !formData.endDate || isCheckingAvailability}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                  {isCheckingAvailability ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  )}
                  {isCheckingAvailability ? 'Checking Availability...' : 'Check Availability'}
                </Button>

                {/* Availability Status */}
                <AnimatePresence mode="wait">
                  {availabilityChecked && (
                    <motion.div
                      key={isAvailable ? 'available' : 'unavailable'}
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 shadow-sm ${
                        isAvailable
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 dark:from-green-950/50 dark:to-emerald-950/30 dark:border-green-800 dark:text-green-200'
                          : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800 dark:from-red-950/50 dark:to-rose-950/30 dark:border-red-800 dark:text-red-200'
                      }`}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      >
                        {isAvailable ? (
                          <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-6 w-6 flex-shrink-0" />
                        )}
                      </motion.div>
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm font-semibold"
                      >
                        {isAvailable
                          ? 'Car is available for selected dates ✨'
                          : 'Car is not available - conflicts detected ⚠️'}
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Customer Selection - Only show if available */}
              <AnimatePresence>
                {isAvailable && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label htmlFor="customerId" className="text-sm font-medium">Select Customer *</Label>
                    <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                      <SelectTrigger className="transition-all hover:border-primary/50">
                        <SelectValue placeholder="Choose a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customersData?.items?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName} ({customer.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes */}
              <AnimatePresence>
                {isAvailable && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any special requirements..."
                      className="transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3 pt-4"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 transition-all hover:scale-[1.02]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isAvailable || !formData.customerId || createBookingMutation.isPending}
                  className="flex-1 relative overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-lg"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                      Create Booking
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Conflict Warning Modal */}
      <ConflictWarningModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        conflict={conflict}
        nextAvailableAfter={nextAvailable ?? undefined}
        onViewConflict={() => {
          setShowConflictModal(false);
          if (formData.carId) {
            router.push(`/dashboard/fleet/cars/${formData.carId}/calendar`);
          }
        }}
      />
    </>
  );
}
