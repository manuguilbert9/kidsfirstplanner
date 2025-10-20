'use client';

import { CalendarX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export function EmptyCalendarState() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CalendarX className="w-10 h-10 text-primary" />
          </div>

          <h3 className="text-2xl font-bold mb-3">Calendrier vide</h3>

          <p className="text-muted-foreground mb-2">
            Vous n&apos;avez pas encore configuré votre planning de garde.
          </p>

          <p className="text-sm text-muted-foreground mb-6">
            Configurez votre planning d&apos;alternance pour commencer à organiser les gardes.
          </p>

          <Button
            onClick={() => router.push('/schedule-setup')}
            size="lg"
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurer le planning
          </Button>

          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 La configuration prend moins de 2 minutes et vous permettra de visualiser
              votre planning de coparentalité et de le partager avec l&apos;autre parent.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
