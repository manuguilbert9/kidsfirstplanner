'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { mockEvents } from '@/lib/mock-data';
import type { CustodyEvent, RecurringSchedule } from '@/lib/types';
import { format, isSameDay, getDay, addDays, setHours, setMinutes, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, areIntervalsOverlapping } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Clock, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
    const weeks = eachWeekOfInterval(visibleRange, { weekStartsOn: schedule.alternatingWeekDay as any, locale: fr });
    const [handoverHour, handoverMinute] = schedule.handoverTime.split(':').map(Number);
    
    let isParentAWeek = true;
    const scheduleStartWeek = startOfWeek(schedule.startDate, { weekStartsOn: schedule.alternatingWeekDay as any, locale: fr });

    for (const weekStart of weeks) {
        if (weekStart < scheduleStartWeek) continue;

        const weekNumber = Math.floor((weekStart.getTime() - scheduleStartWeek.getTime()) / (1000 * 60 * 60 * 24 * 7));
        isParentAWeek = weekNumber % 2 === 0;

        const currentParent = isParentAWeek ? schedule.parentA : schedule.parentB;
        const nextParent = isParentAWeek ? schedule.parentB : schedule.parentA;
        
        const handoverDateTime = setMinutes(setHours(weekStart, handoverHour), handoverMinute);
        const endOfCustodyWeek = addDays(handoverDateTime, 7);

        const event: CustodyEvent = {
            id: `recurring-${weekStart.toISOString()}`,
            title: `Semaine de garde`,
            start: handoverDateTime,
            end: endOfCustodyWeek,
            parent: currentParent,
            location: 'Alternance',
            description: `Semaine avec ${currentParent}. Passation à ${nextParent} à la fin.`,
            isHandover: true,
        };
        events.push(event);
    }
    return events;
};

const getEventsForDay = (day: Date, allEvents: CustodyEvent[]): CustodyEvent[] => {
    return allEvents.filter(event => 
        isSameDay(event.start, day) || 
        (day > event.start && day < event.end)
    ).sort((a,b) => a.start.getTime() - b.start.getTime());
};


export function CustodyCalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const isMobile = useIsMobile();
  const [showRecurring, setShowRecurring] = useState(true);
  const [recurringSchedule, setRecurringSchedule] = useState<RecurringSchedule | null>({
      alternatingWeekDay: 5, // Friday
      handoverTime: '18:00',
      parentA: 'Parent 1',
      parentB: 'Parent 2',
      startDate: new Date(),
  });

  const visibleMonths = useMemo(() => {
    const firstDay = startOfMonth(date || new Date());
    return [firstDay];
  },[date]);

  const allEvents = useMemo(() => {
    const oneTimeEvents = mockEvents;
    if (!showRecurring || !recurringSchedule) return oneTimeEvents;
    
    const visibleRange = {
      start: startOfMonth(visibleMonths[0]),
      end: endOfMonth(visibleMonths[isMobile ? 0 : 1] ?? visibleMonths[0])
    };

    const recurringEvents = generateRecurringEvents(recurringSchedule, visibleRange)
        .filter(re => {
            // Filtrer les événements récurrents qui chevauchent les passations ponctuelles
            return !oneTimeEvents.some(ote => 
                ote.isHandover && areIntervalsOverlapping(
                    {start: ote.start, end: ote.end},
                    {start: re.start, end: re.end}
                )
            );
        });

    return [...oneTimeEvents, ...recurringEvents];

  }, [recurringSchedule, showRecurring, visibleMonths, isMobile]);

  const eventsForSelectedDay = useMemo(() => {
    return date ? getEventsForDay(date, allEvents) : [];
  }, [date, allEvents]);

  const eventDays = useMemo(() => allEvents.map(event => event.start), [allEvents]);

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
            modifiers={{
                hasEvent: eventDays,
                today: new Date(),
            }}
            modifiersClassNames={{
                hasEvent: 'relative flex items-center justify-center after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary',
                today: 'bg-accent text-accent-foreground rounded-md',
            }}
            numberOfMonths={isMobile ? 1 : 2}
          />
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
