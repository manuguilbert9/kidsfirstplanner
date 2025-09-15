'use client';

import { CustodyCalendarView } from '@/components/schedule/custody-calendar-view';
import { KidsFirstLogo } from '@/components/icons';
import { HeaderActions } from '@/components/layout/header-actions';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading, groupId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!groupId) {
        router.replace('/groups/setup');
      }
    }
  }, [user, loading, groupId, router]);

  if (loading || !user || !groupId) {
    return (
       <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your schedule...</p>
      </div>
    );
  }

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
