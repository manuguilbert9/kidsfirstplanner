'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Plus, Share2 } from 'lucide-react';
import { EventSheet } from '@/components/schedule/event-sheet';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function HeaderActions() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
      </div>
      <EventSheet open={isSheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
