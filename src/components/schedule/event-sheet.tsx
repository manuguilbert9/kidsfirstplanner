'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { SuggestionForm } from './suggestion-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecurringEventForm } from './recurring-event-form';
import { useAuth } from '@/hooks/use-auth';
import type { ParentRole } from '@/lib/types';

interface EventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventSheet({ open, onOpenChange }: EventSheetProps) {
  const { toast } = useToast();
  const { parentRole } = useAuth();
  const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentRole | ''>('');

  useEffect(() => {
    if (open && parentRole) {
      setSelectedParent(parentRole);
    } else if (!open) {
      setSelectedParent('');
    }
  }, [open, parentRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock submission
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      toast({
        title: 'Événement créé',
        description: 'Le nouvel événement de garde a été ajouté au calendrier.',
      });
    }, 1500);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Créer un nouvel événement</SheetTitle>
            <SheetDescription>
              Ajoutez un nouvel événement au calendrier de garde.
            </SheetDescription>
          </SheetHeader>
          <Tabs defaultValue="one-time" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one-time">Ponctuel</TabsTrigger>
              <TabsTrigger value="recurring">Récurrent</TabsTrigger>
            </TabsList>
            <TabsContent value="one-time">
              <form onSubmit={handleSubmit} className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de l'événement</Label>
                  <Input id="title" placeholder="ex: Dépôt à l'école" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent">Parent</Label>
                    <Select required value={selectedParent} onValueChange={(value: ParentRole) => setSelectedParent(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le parent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Parent 1">Parent 1</SelectItem>
                        <SelectItem value="Parent 2">Parent 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Heure de début</Label>
                    <Input id="start-time" type="time" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">Heure de fin</Label>
                    <Input id="end-time" type="time" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lieu</Label>
                  <Input id="location" placeholder="ex: 123 Rue Principale" required />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="handover" />
                  <Label htmlFor="handover">Est-ce un événement de passation ?</Label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSuggestionModalOpen(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-primary" />
                  Suggérer une heure de passation
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (facultatif)</Label>
                  <Textarea id="description" placeholder="Ajoutez des détails supplémentaires" />
                </div>
                
                <SheetFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                  <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-white">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sauvegarder l'événement
                  </Button>
                </SheetFooter>
              </form>
            </TabsContent>
            <TabsContent value="recurring">
                <RecurringEventForm onSave={() => onOpenChange(false)} />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
      <Dialog open={isSuggestionModalOpen} onOpenChange={setSuggestionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Suggérer une heure de passation optimale
            </DialogTitle>
            <DialogDescription>
              Laissez l'IA trouver le meilleur moment pour une passation, en tenant compte du trafic et
              d'autres facteurs.
            </DialogDescription>
          </DialogHeader>
          <SuggestionForm
            onSuggestion={(time) => {
              // Ceci mettrait à jour les champs du formulaire dans une implémentation réelle
              toast({
                title: "Heure mise à jour",
                description: `L'heure de l'événement a été définie sur la suggestion de l'IA : ${time}`,
              });
              setSuggestionModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
