'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { mockEvents } from '@/lib/mock-data';
import type { CustodyEvent, RecurringSchedule, CustodyOverride } from '@/lib/types';
import { format, isSameDay, addDays, setHours, setMinutes, startOfWeek, endOfMonth, isWithinInterval, eachDayOfInterval, differenceInWeeks, getDay, addWeeks, subWeeks, endOfWeek, addMonths, startOfMonth, isAfter, isBefore, isEqual } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Clock, Scissors } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { OverrideSheet } from './override-sheet';

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

const generateRecurringEvents = (
    schedule: RecurringSchedule | null,
    overrides: CustodyOverride[],
    visibleRange: { start: Date, end: Date }
): CustodyEvent[] => {
    
    const events: CustodyEvent[] = [];
    const weekStartsOn = 1; // Lundi
    
    const daysToCover = eachDayOfInterval(visibleRange);

    daysToCover.forEach(day => {
        let currentParent;

        // 1. Check for overrides
        const activeOverride = overrides.find(o => 
            (isAfter(day, o.startDate) || isEqual(day, o.startDate)) &&
            (isBefore(day, o.endDate) || isEqual(day, o.endDate))
        );

        if (activeOverride) {
            currentParent = activeOverride.parent;
        } else if (schedule) {
            // 2. Fallback to recurring schedule
            const scheduleStartDate = new Date(schedule.startDate);
            const weekDiff = differenceInWeeks(day, scheduleStartDate, { weekStartsOn, locale: fr });
            
            if (weekDiff % 2 === 0) {
                currentParent = schedule.parentA;
            } else {
                currentParent = schedule.parentB;
            }
        }

        if (currentParent) {
            events.push({
                id: `bg-${format(day, 'yyyy-MM-dd')}`,
                title: `Garde ${currentParent}`,
                start: day,
                end: addDays(day, 1),
                parent: currentParent,
                location: '',
                description: '',
                isHandover: false,
            });
        }
    });

    // 3. Generate handover events only if recurring schedule exists
    if (schedule) {
        const [handoverHour, handoverMinute] = schedule.handoverTime.split(':').map(Number);
        const scheduleStartDate = new Date(schedule.startDate);
        
        let currentHandover = startOfWeek(scheduleStartDate, { weekStartsOn });
        currentHandover = addDays(currentHandover, getDay(currentHandover) < schedule.alternatingWeekDay ? 
          schedule.alternatingWeekDay - getDay(currentHandover) : 
          (7 - getDay(currentHandover) + schedule.alternatingWeekDay) % 7
        );
         if (isBefore(currentHandover, scheduleStartDate)) {
            currentHandover = addWeeks(currentHandover, 1);
        }

        while (isBefore(currentHandover, visibleRange.start)) {
            currentHandover = addWeeks(currentHandover, 1);
        }
        
        while (isBefore(currentHandover, visibleRange.end) || isEqual(currentHandover, visibleRange.end)) {
            const handoverDateTime = setMinutes(setHours(currentHandover, handoverHour), handoverMinute);
            
            const isInOverride = overrides.some(o => 
                (isAfter(handoverDateTime, o.startDate) || isEqual(handoverDateTime, o.startDate)) &&
                (isBefore(handoverDateTime, o.endDate) || isEqual(handoverDateTime, o.endDate))
            );

            if (isWithinInterval(handoverDateTime, visibleRange) && !isInOverride) {
                const weekDiff = differenceInWeeks(handoverDateTime, scheduleStartDate, { weekStartsOn, locale: fr });
                const fromParent = weekDiff % 2 === 0 ? schedule.parentA : schedule.parentB;
                const toParent = weekDiff % 2 === 0 ? schedule.parentB : schedule.parentA;

                events.push({
                    id: `handover-${format(handoverDateTime, 'yyyy-MM-dd')}`,
                    title: 'Passation',
                    start: handoverDateTime,
                    end: setMinutes(setHours(handoverDateTime, handoverHour + 1), handoverMinute),
                    parent: toParent,
                    location: 'Lieu de passation',
                    description: `Passation de ${fromParent} à ${toParent}`,
                    isHandover: true,
                });
            }
            currentHandover = addWeeks(currentHandover, 1);
        }
    }


    return events;
};

const getEventsForDay = (day: Date, allEvents: CustodyEvent[]): CustodyEvent[] => {
    return allEvents
      .filter(event => (isSameDay(day, event.start) && event.isHandover))
      .sort((a,b) => a.start.getTime() - b.start.getTime());
};


export function CustodyCalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const isMobile = useIsMobile();
  const { parentRole, recurringSchedule, custodyOverrides } = useAuth();
  const [showRecurring, setShowRecurring] = useState(true);
  const [overrideSheetOpen, setOverrideSheetOpen] = useState(false);
  const [contextMenuDate, setContextMenuDate] = useState<Date | null>(null);

  const visibleMonths = useMemo(() => {
    const firstDay = startOfMonth(date || currentMonth);
    const months = [firstDay];
    if (!isMobile) {
      months.push(addMonths(firstDay, 1));
    }
    return months;
  }, [date, currentMonth, isMobile]);

  const { allEvents, parent1Days, parent2Days, overrideDays } = useMemo(() => {
    const oneTimeEvents = mockEvents;
    const visibleRange = {
      start: startOfWeek(visibleMonths[0], { weekStartsOn: 1, locale: fr }),
      end: endOfWeek(endOfMonth(visibleMonths[visibleMonths.length - 1]), { weekStartsOn: 1, locale: fr })
    };
    
    const recurring = showRecurring ? generateRecurringEvents(recurringSchedule, custodyOverrides, visibleRange) : [];

    const combinedEvents = [...oneTimeEvents, ...recurring];

    const p1Days: Date[] = [];
    const p2Days: Date[] = [];
    
    const overrides: Date[] = [];
    custodyOverrides.forEach(o => {
        const overrideInterval = eachDayOfInterval({start: o.startDate, end: o.endDate});
        overrides.push(...overrideInterval);
    })


    combinedEvents.forEach(event => {
      if (event.isHandover) return;
      if (event.parent === 'Parent 1') {
        p1Days.push(event.start);
      } else {
        p2Days.push(event.start);
      }
    });

    return { allEvents: combinedEvents, parent1Days: p1Days, parent2Days: p2Days, overrideDays: overrides };

  }, [recurringSchedule, showRecurring, visibleMonths, custodyOverrides]);

  const eventsForSelectedDay = useMemo(() => {
    return date ? getEventsForDay(date, allEvents) : [];
  }, [date, allEvents]);
  
  const handoverDays = useMemo(() => allEvents.filter(e => e.isHandover).map(event => event.start), [allEvents]);

  const modifiers = {
    hasEvent: handoverDays,
    today: new Date(),
    parent1: parent1Days,
    parent2: parent2Days,
    override: overrideDays,
  };

  const modifiersClassNames = {
    hasEvent: 'relative flex items-center justify-center after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary',
    today: 'bg-accent text-accent-foreground rounded-md',
    parent1: 'day-parent1',
    parent2: 'day-parent2',
    override: 'relative',
  };
  
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(startOfMonth(month));
  };
  
  const handleOverrideClick = (day: Date) => {
    setContextMenuDate(day);
    setOverrideSheetOpen(true);
  }

  const DayWithContextMenu = ({ day }: { day: Date }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
         <div className="relative w-full h-full">
          {overrideDays.some(d => isSameDay(d, day)) && (
            <Scissors className="absolute top-1 right-1 w-3 h-3 text-muted-foreground z-10" />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleOverrideClick(day)}>
          Changer la garde
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );


  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Calendrier</CardTitle>
                  <CardDescription>Sélectionnez un jour pour voir le planning détaillé. Clic droit pour changer une garde.</CardDescription>
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
              month={currentMonth}
              onMonthChange={handleMonthChange}
              weekStartsOn={1}
              components={{
                DayContent: (props) => (
                  <div className="relative w-full h-full">
                    <DayWithContextMenu day={props.date} />
                    <span className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                      {format(props.date, 'd')}
                    </span>
                  </div>
                ),
              }}
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
              <div className="flex items-center gap-2">
                <Scissors className="w-3 h-3" />
                <span>Garde changée</span>
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
              {eventsForSelectedDay.length} événement(s) de passation prévu(s).
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
                  <p>Aucun événement de passation pour ce jour.</p>
                  <p className="text-xs">Les jours de garde sont indiqués par la couleur de fond.</p>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
      <OverrideSheet 
        open={overrideSheetOpen}
        onOpenChange={setOverrideSheetOpen}
        startDate={contextMenuDate}
      />
    </>
  );
}
