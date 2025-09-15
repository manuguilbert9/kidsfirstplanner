import { CustodyCalendarView } from '@/components/schedule/custody-calendar-view';
import { KidsFirstLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SharePage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col min-h-screen">
       <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background/95 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-3">
          <KidsFirstLogo className="w-8 h-8" />
          <div className='flex flex-col'>
            <h1 className="text-lg font-bold font-headline bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-transparent bg-clip-text">
                KidsFirst Planner
            </h1>
            <p className="text-xs text-muted-foreground">Consultation d'un calendrier partagé</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/">Créez le vôtre</Link>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6">
        {/* Dans une vraie application, une prop serait passée pour désactiver l'édition */}
        <CustodyCalendarView />
      </main>
    </div>
  );
}
