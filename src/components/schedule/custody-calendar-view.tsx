'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { mockEvents } from '@/lib/mock-data';
import type { CustodyEvent } from '@/lib/types';
import { format, isSameDay, isToday } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Clock, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
          {event.isHandover && <Badge variant="secondary">Handover</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {format(event.start, 'p')} - {format(event.end, 'p')}
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
  const isMobile = useIsMobile();

  const eventsForSelectedDay = useMemo(() => {
    return date ? mockEvents.filter((event) => isSameDay(event.start, date)).sort((a,b) => a.start.getTime() - b.start.getTime()) : [];
  }, [date]);

  const eventDays = useMemo(() => mockEvents.map(event => event.start), []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="flex flex-col lg:col-span-2">
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>Select a day to see the detailed schedule.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="p-0"
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
            {date ? format(date, 'MMMM d, yyyy') : 'No date selected'}
          </CardTitle>
          <CardDescription>
            {eventsForSelectedDay.length} event(s) scheduled.
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
                <p>No events for this day.</p>
                <p className="text-xs">Select a day with a dot to see events.</p>
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
