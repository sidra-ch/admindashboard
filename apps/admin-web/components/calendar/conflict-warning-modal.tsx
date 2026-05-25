import { AlertTriangle, Calendar, User, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatDateTime } from '../../lib/formatters';

interface ConflictWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict?: {
    type: 'booking' | 'rental' | 'maintenance';
    id: string;
    startAt: string;
    endAt: string;
    customerName?: string;
    status?: string;
    description?: string;
  };
  nextAvailableAfter?: string;
  onViewConflict?: () => void;
}

export function ConflictWarningModal({
  isOpen,
  onClose,
  conflict,
  nextAvailableAfter,
  onViewConflict,
}: ConflictWarningModalProps) {
  if (!conflict) return null;

  const conflictTypeLabels = {
    booking: 'Booking',
    rental: 'Rental',
    maintenance: 'Maintenance',
  };

  const conflictTypeColors = {
    booking: 'info',
    rental: 'success',
    maintenance: 'warning',
  } as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-md rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground hover:rotate-90"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="border-b border-border/50 p-6 pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mb-3 inline-flex rounded-full bg-destructive/10 p-3"
                >
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold"
                >
                  Car Not Available
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-1 text-sm text-muted-foreground"
                >
                  This car is already {conflict.type === 'maintenance' ? 'scheduled for maintenance' : 'occupied'} during the selected time period.
                </motion.p>
              </div>

              {/* Content */}
              <div className="space-y-4 p-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="group rounded-xl border border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Conflict Type</span>
                      <Badge variant={conflictTypeColors[conflict.type]} className="shadow-sm">
                        {conflictTypeLabels[conflict.type]}
                      </Badge>
                    </div>

                    {conflict.customerName && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-medium">{conflict.customerName}</span>
                      </motion.div>
                    )}

                    {conflict.description && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.65 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-muted-foreground">Description:</span>
                        <span className="font-medium">{conflict.description}</span>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="flex items-start gap-2 rounded-lg bg-background/50 p-3 text-sm"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">Occupied Period</div>
                        <div className="font-medium">
                          {formatDateTime(conflict.startAt)}
                          <span className="mx-2 text-muted-foreground">→</span>
                          {formatDateTime(conflict.endAt)}
                        </div>
                      </div>
                    </motion.div>

                    {conflict.status && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.75 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="default" className="shadow-sm">{conflict.status}</Badge>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {nextAvailableAfter && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, type: 'spring' }}
                    className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/30"
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="rounded-full bg-green-100 p-2 dark:bg-green-900/50"
                      >
                        <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-green-900 dark:text-green-100">Next Available</div>
                        <div className="mt-1 text-xs text-green-700 dark:text-green-300">
                          This car will be available after:
                        </div>
                        <div className="mt-2 text-sm font-bold text-green-900 dark:text-green-100">
                          {formatDateTime(nextAvailableAfter)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex gap-2 border-t border-border/50 bg-muted/30 p-4 rounded-b-2xl"
              >
                {onViewConflict && (
                  <Button
                    variant="outline"
                    onClick={onViewConflict}
                    className="flex-1 transition-all hover:scale-105"
                  >
                    View Conflict
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  className="flex-1 transition-all hover:scale-105"
                >
                  Close
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
