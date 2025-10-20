'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ScheduleWizard } from '@/components/onboarding/schedule-wizard';
import { KidsFirstLogo } from '@/components/icons';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ScheduleSetupPage() {
  const { user, loading, groupId, recurringSchedule, updateRecurringSchedule } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!groupId) {
        router.replace('/groups/setup');
      } else if (recurringSchedule) {
        // Schedule already configured, go to calendar
        router.replace('/');
      }
    }
  }, [user, loading, groupId, recurringSchedule, router]);

  if (loading || !user || !groupId || recurringSchedule) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleWizardComplete = async (data: {
    yourName: string;
    otherParentName: string;
    startDate: Date;
    startingParent: 'you' | 'other';
    handoverDay: number;
    handoverTime: string;
  }) => {
    try {
      // Create the recurring schedule
      const schedule = {
        alternatingWeekDay: data.handoverDay,
        handoverTime: data.handoverTime,
        parentA: data.startingParent === 'you' ? 'Parent 1' as const : 'Parent 2' as const,
        parentB: data.startingParent === 'you' ? 'Parent 2' as const : 'Parent 1' as const,
        startDate: data.startDate,
      };

      await updateRecurringSchedule(schedule);

      // Save parent names to Firestore
      if (user && groupId) {
        // Update user's firstName
        await setDoc(doc(db, 'users', user.uid), {
          firstName: data.yourName
        }, { merge: true });

        // Update group with parent names
        await setDoc(doc(db, 'groups', groupId), {
          parentNames: {
            'Parent 1': data.startingParent === 'you' ? data.yourName : data.otherParentName,
            'Parent 2': data.startingParent === 'you' ? data.otherParentName : data.yourName
          }
        }, { merge: true });
      }

      toast({
        title: 'Planning créé !',
        description: `Votre planning de coparentalité est maintenant configuré.`,
      });

      // Redirect to calendar
      router.push('/');
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le planning. Veuillez réessayer.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 dark:from-background dark:to-background p-4">
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="flex flex-col items-center mb-8">
          <KidsFirstLogo className="w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-transparent bg-clip-text">
            Configurez votre planning
          </h1>
          <p className="text-muted-foreground mt-2 text-center max-w-md">
            Quelques questions rapides pour personnaliser votre calendrier de coparentalité
          </p>
        </div>

        <ScheduleWizard
          currentUserEmail={user.email}
          onComplete={handleWizardComplete}
        />
      </div>
    </div>
  );
}
