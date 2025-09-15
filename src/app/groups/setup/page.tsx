'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { KidsFirstLogo } from '@/components/icons';
import { Loader2, Plus, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GroupSetupPage() {
  const { user, loading, createGroup, joinGroup, groupId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

   useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (groupId) {
        router.replace('/');
      }
    }
  }, [user, loading, groupId, router]);

  if (loading || !user || groupId) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreateGroup = async () => {
    if (!user) return;
    if (!groupName.trim()) {
        setError('Veuillez donner un nom à votre groupe.');
        return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const newGroupId = await createGroup(user.uid, groupName);
      toast({
        title: 'Groupe créé !',
        description: `Le code de votre nouveau groupe est : ${newGroupId}. Partagez-le avec l'autre parent.`,
      });
      router.push('/');
    } catch (e) {
      console.error(e);
      setError('La création du groupe a échoué. Veuillez réessayer.');
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user) return;
     if (!joinCode.trim()) {
        setError('Veuillez entrer un code de groupe pour le rejoindre.');
        return;
    }
    setIsJoining(true);
    setError(null);
    try {
      const success = await joinGroup(user.uid, joinCode.trim().toUpperCase());
      if (success) {
        toast({
          title: 'Groupe rejoint avec succès !',
          description: 'Vous êtes maintenant prêt à consulter le calendrier partagé.',
        });
        router.push('/');
      } else {
        setError('Code de groupe invalide. Veuillez vérifier le code et réessayer.');
        setIsJoining(false);
      }
    } catch (e) {
      console.error(e);
      setError('Impossible de rejoindre le groupe. Veuillez réessayer.');
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-8">
            <KidsFirstLogo className="w-16 h-16 mb-4" />
             <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-transparent bg-clip-text">
                Configurez votre groupe familial
            </h1>
            <p className="text-muted-foreground mt-2 text-center">Pour partager un calendrier, vous devez être dans un groupe avec l'autre parent.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/20 p-2 rounded-full">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Créer un nouveau groupe</CardTitle>
                    </div>
                    <CardDescription>Démarrez un nouveau calendrier. Vous obtiendrez un code unique pour inviter l'autre parent.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                        <label htmlFor="groupName" className="text-sm font-medium">Nom du groupe</label>
                        <Input 
                            id="groupName"
                            placeholder="ex: Les enfants Smith" 
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCreateGroup} disabled={isCreating || !groupName.trim()} className="w-full mt-4">
                        {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Créer un groupe
                    </Button>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/20 p-2 rounded-full">
                            <LogIn className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Rejoindre un groupe existant</CardTitle>
                    </div>
                    <CardDescription>Si l'autre parent a déjà créé un groupe, entrez le code qu'il vous a partagé.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                     <div className="space-y-2">
                        <label htmlFor="joinCode" className="text-sm font-medium">Code du groupe</label>
                        <Input
                            id="joinCode"
                            placeholder="Entrez le code à 6 chiffres"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            maxLength={6}
                        />
                    </div>
                    <Button onClick={handleJoinGroup} disabled={isJoining || !joinCode.trim()} className="w-full mt-4">
                         {isJoining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Rejoindre le groupe
                    </Button>
                </CardContent>
            </Card>
        </div>
         {error && <p className="text-destructive text-center mt-6">{error}</p>}
      </div>
    </div>
  );
}
