'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { mockEvents } from '@/lib/mock-data';
import type { CustodyEvent, RecurringSchedule } from '@/lib/types';
import { format, isSameDay, addDays, setHours, setMinutes, startOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval, differenceInWeeks, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

function EventCard({ event }: { event: CustodyEvent }) {
  return (
    <Card className="transition-all duration-300 border-l-4 hover:shadow-lg bg-card/80 border-primary">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-headline">{event.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="w-3 h-3" />
              {event.parent}
            </CardDescription>
          </div>
          {event.isHandover && <Badge variant="secondary">Passation</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {format(event.start, 'p', { locale: fr })} - {format(event.end, 'p', { locale: fr })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{event.location}</span>
        </div>
        {event.description && <p className="pt-2">{event.description}</p>}
      </CardContent>
    </Card>
  );
}

const generateRecurringEvents = (schedule: RecurringSchedule | null, visibleRange: { start: Date, end: Date }): CustodyEvent[] => {
    if (!schedule) return [];

    const events: CustodyEvent[] = [];
    const weeks = eachWeekOfInterval(visibleRange, { weekStartsOn: 1, locale: fr });
    const [handoverHour, handoverMinute] = schedule.handoverTime.split(':').map(Number);
    const scheduleStartDate = new Date(schedule.startDate);

    for (const weekStart of weeks) {
        // Find the specific handover day in the current week.
        // getDay returns 0 for Sunday, we want Monday to be 1.
        const dayOfWeek = getDay(weekStart) === 0 ? 7 : getDay(weekStart);
        const daysToAdd = schedule.alternatingWeekDay - dayOfWeek;
        let handoverDayThisWeek = addDays(weekStart, daysToAdd);

        // If the calculated handover is before the schedule start, move to the next week
        if (handoverDayThisWeek < scheduleStartDate) {
            handoverDayThisWeek = addDays(handoverDayThisWeek, 7);
        }

        if (handoverDayThisWeek > visibleRange.end) continue;
        
        const handoverDateTime = setMinutes(setHours(handoverDayThisWeek, handoverHour), handoverMinute);

        // Determine who has custody this week based on the week number since the start date
        const weekNumber = differenceInWeeks(handoverDateTime, scheduleStartDate, { weekStartsOn: 1, locale: fr });

        const isParentAWeek = weekNumber % 2 === 0;

        const currentParent = isParentAWeek ? schedule.parentA : schedule.parentB;
        const nextParent = isParentAWeek ? schedule.parentB : schedule.parentA;
        
        if (!isWithinInterval(handoverDateTime, visibleRange)) continue;
        
        const startOfCustodyWeek = handoverDateTime;
        const endOfCustodyWeek = addDays(handoverDateTime, 7);

        const event: CustodyEvent = {
            id: `recurring-${weekStart.toISOString()}`,
            title: `Garde de ${currentParent}`,
            start: startOfCustodyWeek,
            end: endOfCustodyWeek,
            parent: currentParent,
            location: 'Alternance',
            description: `Semaine avec ${currentParent}. Passation à ${nextParent} à la fin.`,
            isHandover: false,
        };

        const handoverEvent: CustodyEvent = {
            id: `handover-${weekStart.toISOString()}`,
            title: 'Passation',
            start: handoverDateTime,
            end: setMinutes(setHours(handoverDateTime, handoverHour + 1), handoverMinute),
            parent: nextParent,
            location: 'Lieu de passation',
            description: `Passation de ${currentParent} à ${nextParent}`,
            isHandover: true,
        };
        
        events.push(event, handoverEvent);
    }
    return events;
};

const getEventsForDay = (day: Date, allEvents: CustodyEvent[]): CustodyEvent[] => {
    return allEvents
      .filter(event => isWithinInterval(day, { start: event.start, end: event.end }) && !isSameDay(day, event.end))
      .sort((a,b) => a.start.getTime() - b.start.getTime());
};


export function CustodyCalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const isMobile = useIsMobile();
  const { parentRole, recurringSchedule } = useAuth();
  const [showRecurring, setShowRecurring] = useState(true);

  const visibleMonths = useMemo(() => {
    const firstDay = startOfMonth(date || new Date());
    return [firstDay];
  },[date]);

  const { allEvents, parent1Days, parent2Days } = useMemo(() => {
    const oneTimeEvents = mockEvents;
    const visibleRange = {
      start: startOfMonth(visibleMonths[0]),
      end: endOfMonth(visibleMonths[isMobile ? 0 : 1] ?? visibleMonths[0])
    };
    
    const recurring = showRecurring ? generateRecurringEvents(recurringSchedule, visibleRange) : [];

    const combinedEvents = [...oneTimeEvents, ...recurring];

    const p1Days: Date[] = [];
    const p2Days: Date[] = [];

    combinedEvents.forEach(event => {
      if (event.isHandover) return;

      const eventDays = eachDayOfInterval({ start: event.start, end: event.end });
      if (event.parent === 'Parent 1') {
        p1Days.push(...eventDays);
      } else {
        p2Days.push(...eventDays);
      }
    });

    return { allEvents: combinedEvents, parent1Days: p1Days, parent2Days: p2Days };

  }, [recurringSchedule, showRecurring, visibleMonths, isMobile]);

  const eventsForSelectedDay = useMemo(() => {
    return date ? getEventsForDay(date, allEvents) : [];
  }, [date, allEvents]);
  
  const handoverDays = useMemo(() => allEvents.filter(e => e.isHandover).map(event => event.start), [allEvents]);

  const modifiers = {
    hasEvent: handoverDays,
    today: new Date(),
    parent1: parent1Days,
    parent2: parent2Days,
  };

  const modifiersClassNames = {
    hasEvent: 'relative flex items-center justify-center after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary',
    today: 'bg-accent text-accent-foreground rounded-md',
    parent1: 'day-parent1',
    parent2: 'day-parent2',
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="flex flex-col lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                <CardTitle>Calendrier</CardTitle>
                <CardDescription>Sélectionnez un jour pour voir le planning détaillé.</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                    id="recurring-toggle" 
                    checked={showRecurring} 
                    onCheckedChange={setShowRecurring}
                    disabled={!recurringSchedule}
                />
                <Label htmlFor="recurring-toggle">Afficher le récurrent</Label>
              </div>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="p-0"
            locale={fr}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            numberOfMonths={isMobile ? 1 : 2}
            weekStartsOn={1}
          />
        </CardContent>
         <CardContent className="pt-0">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-parent1/80"></span>
              <span>Parent 1 {parentRole === 'Parent 1' && '(Vous)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-parent2/80"></span>
              <span>Parent 2 {parentRole === 'Parent 2' && '(Vous)'}</span>
            </div>
             <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Passation</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>
            {date ? format(date, 'd MMMM yyyy', { locale: fr }) : 'Aucune date sélectionnée'}
          </CardTitle>
          <CardDescription>
            {eventsForSelectedDay.length} événement(s) prévu(s).
          </CardDescription>
        </CardHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <CardContent className="p-4">
            {eventsForSelectedDay.length > 0 ? (
              <div className="space-y-4">
                {eventsForSelectedDay.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p>Aucun événement pour ce jour.</p>
                <p className="text-xs">Sélectionnez un jour avec un point pour voir les événements.</p>
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}

    