import { Customer } from '../types/pos';

export interface RelievingCheckResult {
  isPastRelieving: boolean;
  isTodayRelieving: boolean;
  isApproachingRelieving: boolean; // within 30 days
  daysRemaining: number;
  statusLabel: string;
  statusBadgeColor: string;
}

/**
 * Evaluates a customer's relieving date relative to today's date.
 */
export function checkRelievingDate(customer: Customer, referenceDate: Date = new Date()): RelievingCheckResult {
  if (customer.is_disabled) {
    return {
      isPastRelieving: false,
      isTodayRelieving: false,
      isApproachingRelieving: false,
      daysRemaining: 0,
      statusLabel: 'Disabled Account',
      statusBadgeColor: 'bg-red-950/60 text-red-400 border-red-800/60',
    };
  }

  if (!customer.relieving_date) {
    return {
      isPastRelieving: false,
      isTodayRelieving: false,
      isApproachingRelieving: false,
      daysRemaining: 9999,
      statusLabel: 'Active Student',
      statusBadgeColor: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    };
  }

  const target = new Date(customer.relieving_date);
  target.setHours(0, 0, 0, 0);

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - ref.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isToday = diffDays === 0;
  const isPast = diffDays < 0;
  const isApproaching = diffDays > 0 && diffDays <= 30;

  if (isPast) {
    return {
      isPastRelieving: true,
      isTodayRelieving: false,
      isApproachingRelieving: false,
      daysRemaining: diffDays,
      statusLabel: `Relieved (${Math.abs(diffDays)}d ago)`,
      statusBadgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    };
  }

  if (isToday) {
    return {
      isPastRelieving: false,
      isTodayRelieving: true,
      isApproachingRelieving: true,
      daysRemaining: 0,
      statusLabel: 'Relieving Today',
      statusBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    };
  }

  if (isApproaching) {
    return {
      isPastRelieving: false,
      isTodayRelieving: false,
      isApproachingRelieving: true,
      daysRemaining: diffDays,
      statusLabel: `Relieving in ${diffDays}d`,
      statusBadgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    };
  }

  return {
    isPastRelieving: false,
    isTodayRelieving: false,
    isApproachingRelieving: false,
    daysRemaining: diffDays,
    statusLabel: 'Active Student',
    statusBadgeColor: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  };
}
