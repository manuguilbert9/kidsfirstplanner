'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { mockEvents } from '@/lib/mock-data';
import type { CustodyEvent, RecurringSchedule } from '@/lib/types';
import { format, isSameDay, addDays, setHours, setMinutes, startOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval, differenceInWeeks, getDay, addWeeks, subWeeks, subDays, endOfWeek, addMonths } from 'date-fns';
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
    const scheduleStartDate = new Date(schedule.startDate);
    const weekStartsOn = 1; // Lundi

    // Déterminer le parent qui a la garde au début du planning
    const firstWeekParent = schedule.parentA;
    const secondWeekParent = schedule.parentB;

    const daysToCover = eachDayOfInterval(visibleRange);

    daysToCover.forEach(day => {
        // Calcule la différence en semaines entre le jour actuel et le début du planning
        const weekDiff = differenceInWeeks(day, scheduleStartDate, { weekStartsOn, locale: fr });
        
        let currentParent;
        // La semaine est paire ou impaire ?
        if (weekDiff % 2 === 0) {
            currentParent = firstWeekParent; // Semaine du Parent A
        } else {
            currentParent = secondWeekParent; // Semaine du Parent B
        }

        // Crée un "événement" de fond pour la journée entière
        events.push({
            id: `bg-${format(day, 'yyyy-MM-dd')}`,
            title: `Garde ${currentParent}`,
            start: day,
            end: addDays(day, 1), // L'événement dure toute la journée
            parent: currentParent,
            location: '',
            description: '',
            isHandover: false,
        });
    });

    // Générer les événements de passation visibles
    const [handoverHour, handoverMinute] = schedule.handoverTime.split(':').map(Number);
    
    // Trouver le premier jour de passation
    let currentHandover = startOfWeek(scheduleStartDate, { weekStartsOn });
    currentHandover = addDays(currentHandover, schedule.alternatingWeekDay - 1);
    if (currentHandover < scheduleStartDate) {
      currentHandover = addWeeks(currentHandover, 1);
    }
    
    // Reculer pour trouver la première passation potentiellement visible
    while (currentHandover > visibleRange.start) {
        currentHandover = subWeeks(currentHandover, 1);
    }
     // Avancer pour trouver la première passation dans la vue
    while (currentHandover < visibleRange.start) {
        currentHandover = addWeeks(currentHandover, 1);
    }


    while (currentHandover <= visibleRange.end) {
        const handoverDateTime = setMinutes(setHours(currentHandover, handoverHour), handoverMinute);
        
        if (isWithinInterval(handoverDateTime, visibleRange)) {
            const weekDiff = differenceInWeeks(handoverDateTime, scheduleStartDate, { weekStartsOn, locale: fr });
            const fromParent = weekDiff % 2 === 0 ? schedule.parentA : schedule.parentB;
            const toParent = weekDiff % 2 === 0 ? schedule.parentB : schedule.parentA;

            events.push({
                id: `handover-${format(handoverDateTime, 'yyyy-MM-dd')}`,
                title: 'Passation',
                start: handoverDateTime,
                end: setMinutes(setHours(handoverDateTime, handoverHour + 1), handoverMinute),
                parent: toParent, // Le parent qui reçoit l'enfant
                location: 'Lieu de passation',
                description: `Passation de ${fromParent} à ${toParent}`,
                isHandover: true,
            });
        }
        
        currentHandover = addWeeks(currentHandover, 1);
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
  const { parentRole, recurringSchedule } = useAuth();
  const [showRecurring, setShowRecurring] = useState(true);

  const visibleMonths = useMemo(() => {
    const firstDay = startOfMonth(date || currentMonth);
    const months = [firstDay];
    if (!isMobile) {
      months.push(addMonths(firstDay, 1));
    }
    return months;
  }, [date, currentMonth, isMobile]);

  const { allEvents, parent1Days, parent2Days } = useMemo(() => {
    const oneTimeEvents = mockEvents;
    const visibleRange = {
      start: startOfWeek(visibleMonths[0], { weekStartsOn: 1, locale: fr }),
      end: endOfWeek(endOfMonth(visibleMonths[visibleMonths.length - 1]), { weekStartsOn: 1, locale: fr })
    };
    
    const recurring = showRecurring ? generateRecurringEvents(recurringSchedule, visibleRange) : [];

    const combinedEvents = [...oneTimeEvents, ...recurring];

    const p1Days: Date[] = [];
    const p2Days: Date[] = [];

    combinedEvents.forEach(event => {
      if (event.isHandover) return;
      if (event.parent === 'Parent 1') {
        p1Days.push(event.start);
      } else {
        p2Days.push(event.start);
      }
    });

    return { allEvents: combinedEvents, parent1Days: p1Days, parent2Days: p2Days };

  }, [recurringSchedule, showRecurring, visibleMonths]);

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
  
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(startOfMonth(month));
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
            month={currentMonth}
            onMonthChange={handleMonthChange}
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
  );
}

    