import { useMemo } from 'react';
import { eachDayOfInterval } from 'date-fns';
import type { CustodyEvent, ParentRole } from '@/lib/types';
import {
  generateRecurringEvents,
  getEventsForDay,
  isHandoverDay,
  getCurrentParent,
  separateEventsByParent,
} from '@/lib/schedule-utils';
import { useAuth } from './use-auth';

interface UseScheduleOptions {
  visibleRange: { start: Date; end: Date };
  showRecurring?: boolean;
  additionalEvents?: CustodyEvent[];
}

/**
 * Hook to manage schedule calculations and event generation
 * Centralizes all schedule-related logic
 */
export function useSchedule({
  visibleRange,
  showRecurring = true,
  additionalEvents = [],
}: UseScheduleOptions) {
  const { recurringSchedule, custodyOverrides, getFirstName } = useAuth();

  // Generate recurring events
  const recurringEvents = useMemo(() => {
    if (!showRecurring || !recurringSchedule) return [];
    return generateRecurringEvents(
      recurringSchedule,
      custodyOverrides,
      visibleRange,
      getFirstName
    );
  }, [showRecurring, recurringSchedule, custodyOverrides, visibleRange, getFirstName]);

  // Combine all events
  const allEvents = useMemo(() => {
    return [...additionalEvents, ...recurringEvents];
  }, [additionalEvents, recurringEvents]);

  // Separate events by parent for calendar coloring
  const { parent1Days, parent2Days, handoverDays } = useMemo(() => {
    return separateEventsByParent(allEvents);
  }, [allEvents]);

  // Get override days for display
  const overrideDays = useMemo(() => {
    const days: Date[] = [];
    custodyOverrides.forEach(o => {
      const interval = eachDayOfInterval({ start: o.startDate, end: o.endDate });
      days.push(...interval);
    });
    return days;
  }, [custodyOverrides]);

  /**
   * Get events for a specific day
   */
  const getEventsFor = (day: Date): CustodyEvent[] => {
    return getEventsForDay(day, allEvents);
  };

  /**
   * Check if a day is a handover day
   */
  const isHandover = (day: Date): boolean => {
    return isHandoverDay(day, allEvents);
  };

  /**
   * Get the parent who has custody on a specific date
   */
  const getParentForDate = (date: Date): ParentRole | null => {
    return getCurrentParent(date, recurringSchedule, custodyOverrides);
  };

  return {
    // Data
    allEvents,
    parent1Days,
    parent2Days,
    overrideDays,
    handoverDays,

    // Functions
    getEventsFor,
    isHandover,
    getParentForDate,

    // State
    hasSchedule: !!recurringSchedule,
  };
}
