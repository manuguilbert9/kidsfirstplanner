'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import type { CustodyEvent, ParentRole } from '@/lib/types';
import { format, isSameDay, endOfMonth, endOfWeek, addMonths, startOfMonth, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Clock, Scissors, Replace } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { OverrideSheet } from './override-sheet';
import { Button } from '../ui/button';
import { EmptyCalendarState } from './empty-calendar-state';
import { useSchedule } from '@/hooks/use-schedule';

function EventCard({ event, getFirstName }: { event: CustodyEvent; getFirstName: (role: ParentRole) => string }) {
  return (
    <Card className="transition-all duration-300 border-l-4 hover:shadow-lg bg-card/80 border-primary">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-headline">{event.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="w-3 h-3" />
              {getFirstName(event.parent)}
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


export function CustodyCalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const isMobile = useIsMobile();
  const { parentRole, recurringSchedule, getFirstName } = useAuth();
  const [showRecurring, setShowRecurring] = useState(true);
  const [overrideSheetOpen, setOverrideSheetOpen] = useState(false);

  const visibleMonths = useMemo(() => {
    const firstDay = startOfMonth(date || currentMonth);
    const months = [firstDay];
    if (!isMobile) {
      months.push(addMonths(firstDay, 1));
    }
    return months;
  }, [date, currentMonth, isMobile]);
  
  const visibleRange = useMemo(() => {
     const start = startOfWeek(visibleMonths[0], { weekStartsOn: 1, locale: fr });
     const end = endOfWeek(endOfMonth(visibleMonths[visibleMonths.length - 1]), { weekStartsOn: 1, locale: fr });
     return { start, end };
  }, [visibleMonths]);

    // Use the schedule hook for all schedule calculations
  const {
    parent1Days,
    parent2Days,
    overrideDays,
    handoverDays,
    getEventsFor,
    hasSchedule
  } = useSchedule({
    visibleRange,
    showRecurring,
  });

  const eventsForSelectedDay = useMemo(() => {
    return date ? getEventsFor(date) : [];
  }, [date, getEventsFor]);
  

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
  
  const handleOverrideClick = () => {
    setOverrideSheetOpen(true);
  }
  // Show empty state if no schedule configured
  if (!hasSchedule) {
    return <EmptyCalendarState />;
  }


  return (
    <>
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
              components={{
                DayContent: (props) => (
                   <div className="relative w-full h-full flex items-center justify-center">
                    {overrideDays.some(d => isSameDay(d, props.date)) && (
                      <Scissors className="absolute top-1 right-1 w-3 h-3 text-muted-foreground z-10" />
                    )}
                    {format(props.date, 'd')}
                  </div>
                ),
              }}
            />
          </CardContent>
          <CardContent className="pt-0">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-parent1/80"></span>
                <span>{getFirstName('Parent 1')} {parentRole === 'Parent 1' && '(Vous)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-parent2/80"></span>
                <span>{getFirstName('Parent 2')} {parentRole === 'Parent 2' && '(Vous)'}</span>
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
                    <EventCard key={event.id} event={event} getFirstName={getFirstName} />
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
           {date && (
            <>
              <Separator />
              <CardContent className="p-4">
                  <Button variant="outline" className="w-full" onClick={handleOverrideClick}>
                    <Replace className="mr-2 h-4 w-4" />
                    Changer la garde
                  </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
      <OverrideSheet 
        open={overrideSheetOpen}
        onOpenChange={setOverrideSheetOpen}
        startDate={date}
      />
    </>
  );
}
