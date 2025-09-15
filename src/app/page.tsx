import { CustodyCalendarView } from '@/components/schedule/custody-calendar-view';
import { KidsFirstLogo } from '@/components/icons';
import { HeaderActions } from '@/components/layout/header-actions';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b shrink-0 bg-background/95 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-3">
          <KidsFirstLogo className="w-8 h-8" />
          <h1 className="text-xl font-bold font-headline bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-transparent bg-clip-text">
            KidsFirst Planner
          </h1>
        </div>
        <HeaderActions />
      </header>
      <main className="flex-1 p-4 md:p-6">
        <CustodyCalendarView />
      </main>
    </div>
  );
}
