'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Plus, Share2, LogOut, User as UserIcon } from 'lucide-react';
import { EventSheet } from '@/components/schedule/event-sheet';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import type { ParentRole } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function HeaderActions() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();
  const { user, parentRole, updateParentRole } = useAuth();

  const handleExport = () => {
    toast({
      title: 'Exportation du calendrier',
      description: 'Votre calendrier est en cours de préparation pour le téléchargement.',
    });
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/schedule-123`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Lien copié !',
        description: 'Un lien partageable a été copié dans votre presse-papiers.',
      });
    });
  };
  
  const handleSignOut = async () => {
    await auth.signOut();
  }

  const handleRoleChange = async (role: string) => {
    if (user && (role === 'Parent 1' || role === 'Parent 2')) {
      try {
        await updateParentRole(user.uid, role as ParentRole);
        toast({
          title: 'Rôle mis à jour',
          description: `Vous êtes maintenant défini comme ${role}.`,
        });
      } catch (error) {
        console.error("Erreur lors de la mise à jour du rôle", error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de mettre à jour votre rôle.',
        });
      }
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => setSheetOpen(true)}
          className="font-bold text-white bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 mr-2" /> Nouvel événement
        </Button>
        <div className="hidden md:flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" /> Partager
          </Button>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? 'Utilisateur'} />
                       <AvatarFallback>
                         {user?.displayName?.charAt(0) ?? <UserIcon />}
                       </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={parentRole ?? ''} onValueChange={handleRoleChange}>
                   <DropdownMenuLabel>Mon rôle</DropdownMenuLabel>
                   <DropdownMenuRadioItem value="Parent 1">Parent 1</DropdownMenuRadioItem>
                   <DropdownMenuRadioItem value="Parent 2">Parent 2</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EventSheet open={isSheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
