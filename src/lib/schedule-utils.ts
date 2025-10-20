import {
  addDays,
  setHours,
  setMinutes,
  startOfWeek,
  addWeeks,
  subWeeks,
  isWithinInterval,
  isAfter,
  isBefore,
  isEqual,
  differenceInDays,
  eachDayOfInterval,
  format
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CustodyEvent, RecurringSchedule, CustodyOverride, ParentRole } from './types';

/**
 * Calculate which parent has custody on a given date
 */
export function calculateCustodyForDate(
  date: Date,
  schedule: RecurringSchedule,
  overrides: CustodyOverride[]
): ParentRole | null {
  // 1. Check for overrides first
  const activeOverride = overrides.find(o =>
    (isAfter(date, o.startDate) || isEqual(date, o.startDate)) &&
    (isBefore(date, o.endDate) || isEqual(date, o.endDate))
  );

  if (activeOverride) {
    return activeOverride.parent;
  }

  // 2. Fallback to recurring schedule
  const scheduleStartDate = startOfWeek(new Date(schedule.startDate), {
    weekStartsOn: 1,
    locale: fr
  });

  const dayDiff = differenceInDays(date, scheduleStartDate);
  const weekNumber = Math.floor(dayDiff / 7);

  if (weekNumber % 2 === 0) {
    return schedule.parentA;
  } else {
    return schedule.parentB;
  }
}

/**
 * Generate custody events for a date range
 */
export function generateCustodyEvents(
  schedule: RecurringSchedule,
  overrides: CustodyOverride[],
  visibleRange: { start: Date, end: Date },
  getFirstName: (role: ParentRole) => string
): CustodyEvent[] {
  const events: CustodyEvent[] = [];
  const daysToCover = eachDayOfInterval(visibleRange);

  daysToCover.forEach(day => {
    const currentParent = calculateCustodyForDate(day, schedule, overrides);

    if (currentParent) {
      events.push({
        id: `bg-${format(day, 'yyyy-MM-dd')}`,
        title: `Garde ${getFirstName(currentParent)}`,
        start: day,
        end: addDays(day, 1),
        parent: currentParent,
        location: '',
        description: '',
        isHandover: false,
      });
    }
  });

  return events;
}

/**
 * Generate handover events for a date range
 */
export function generateHandoverEvents(
  schedule: RecurringSchedule,
  overrides: CustodyOverride[],
  visibleRange: { start: Date, end: Date },
  getFirstName: (role: ParentRole) => string
): CustodyEvent[] {
  const events: CustodyEvent[] = [];
  const [handoverHour, handoverMinute] = schedule.handoverTime.split(':').map(Number);

  const weekStartsOn = 1; // Monday
  const scheduleStartDate = startOfWeek(new Date(schedule.startDate), {
    weekStartsOn,
    locale: fr
  });

  // Find the first handover day
  let firstHandoverInSchedule = addDays(
    startOfWeek(new Date(schedule.startDate), { weekStartsOn }),
    schedule.alternatingWeekDay - 1
  );

  if (isBefore(firstHandoverInSchedule, new Date(schedule.startDate))) {
    firstHandoverInSchedule = addWeeks(firstHandoverInSchedule, 1);
  }

  // Find the first handover relevant to the visible range
  let currentHandover = firstHandoverInSchedule;
  while (isBefore(currentHandover, visibleRange.start)) {
    currentHandover = addWeeks(currentHandover, 2); // alternating weeks
  }
  while (isAfter(currentHandover, visibleRange.start)) {
    currentHandover = subWeeks(currentHandover, 2); // alternating weeks
  }

  // Generate handover events
  while (isBefore(currentHandover, visibleRange.end) || isEqual(currentHandover, visibleRange.end)) {
    const handoverDateTime = setMinutes(setHours(currentHandover, handoverHour), handoverMinute);

    // Check if handover is within an override period
    const isInOverride = overrides.some(o =>
      (isAfter(handoverDateTime, o.startDate) || isEqual(handoverDateTime, o.startDate)) &&
      (isBefore(handoverDateTime, o.endDate) || isEqual(handoverDateTime, o.endDate))
    );

    if (isWithinInterval(handoverDateTime, visibleRange) && !isInOverride) {
      const dayDiff = differenceInDays(handoverDateTime, scheduleStartDate);
      const weekNumber = Math.floor(dayDiff / 7);

      const fromParent = weekNumber % 2 === 0 ? schedule.parentA : schedule.parentB;
      const toParent = weekNumber % 2 === 0 ? schedule.parentB : schedule.parentA;

      events.push({
        id: `handover-${format(handoverDateTime, 'yyyy-MM-dd')}`,
        title: 'Passation',
        start: handoverDateTime,
        end: setMinutes(setHours(handoverDateTime, handoverHour + 1), handoverMinute),
        parent: toParent,
        location: 'Lieu de passation',
        description: `Passation de ${getFirstName(fromParent)} à ${getFirstName(toParent)}`,
        isHandover: true,
      });
    }

    currentHandover = addWeeks(currentHandover, 2);
  }

  return events;
}

/**
 * Generate all recurring events (custody + handovers) for a date range
 */
export function generateRecurringEvents(
  schedule: RecurringSchedule | null,
  overrides: CustodyOverride[],
  visibleRange: { start: Date, end: Date },
  getFirstName: (role: ParentRole) => string
): CustodyEvent[] {
  if (!schedule) return [];

  const custodyEvents = generateCustodyEvents(schedule, overrides, visibleRange, getFirstName);
  const handoverEvents = generateHandoverEvents(schedule, overrides, visibleRange, getFirstName);

  return [...custodyEvents, ...handoverEvents];
}

/**
 * Get events for a specific day (only handovers)
 */
export function getEventsForDay(day: Date, allEvents: CustodyEvent[]): CustodyEvent[] {
  return allEvents
    .filter(event => {
      const sameYear = day.getFullYear() === event.start.getFullYear();
      const sameMonth = day.getMonth() === event.start.getMonth();
      const sameDay = day.getDate() === event.start.getDate();
      return sameYear && sameMonth && sameDay && event.isHandover;
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Check if a date is a handover day
 */
export function isHandoverDay(date: Date, allEvents: CustodyEvent[]): boolean {
  return getEventsForDay(date, allEvents).length > 0;
}

/**
 * Get the current parent for a specific date
 */
export function getCurrentParent(
  date: Date,
  schedule: RecurringSchedule | null,
  overrides: CustodyOverride[]
): ParentRole | null {
  if (!schedule) return null;
  return calculateCustodyForDate(date, schedule, overrides);
}

/**
 * Separate events by parent for calendar coloring
 */
export function separateEventsByParent(events: CustodyEvent[]): {
  parent1Days: Date[];
  parent2Days: Date[];
  overrideDays: Date[];
  handoverDays: Date[];
} {
  const parent1Days: Date[] = [];
  const parent2Days: Date[] = [];
  const handoverDays: Date[] = [];

  events.forEach(event => {
    if (event.isHandover) {
      handoverDays.push(event.start);
    } else if (event.parent === 'Parent 1') {
      parent1Days.push(event.start);
    } else if (event.parent === 'Parent 2') {
      parent2Days.push(event.start);
    }
  });

  return { parent1Days, parent2Days, overrideDays: [], handoverDays };
}
