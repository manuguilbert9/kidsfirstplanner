'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { KidsFirstLogo } from '@/components/icons';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error('Erreur de connexion avec Google', error);
    }
  };
  
  if (loading || user) {
     return (
       <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <KidsFirstLogo className="w-16 h-16 mb-4" />
             <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-transparent bg-clip-text">
                Bienvenue sur KidsFirst Planner
            </h1>
            <p className="text-muted-foreground mt-2">Le moyen le plus simple de gérer les plannings de coparentalité.</p>
        </div>
        <div className="p-8 rounded-lg shadow-xl bg-card">
           <h2 className="text-xl font-semibold text-center text-card-foreground">Connexion</h2>
           <p className="text-center text-sm text-muted-foreground mt-2 mb-6">Veuillez vous connecter pour accéder à votre planning.</p>
            <Button onClick={handleSignIn} className="w-full font-bold" size="lg">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.6-1.977 12.6-5.25l-5.6-5.592C29.042 35.25 26.66 36 24 36c-5.222 0-9.663-3.238-11.231-7.618l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l5.657 5.657C41.82 36.125 44 30.65 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
                </svg>
                Se connecter avec Google
            </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">En vous connectant, vous acceptez nos Conditions d'utilisation.</p>
      </div>
    </div>
  );
}
