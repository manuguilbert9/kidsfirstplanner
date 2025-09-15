'use client';

import { useState } from 'react';
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

interface EventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventSheet({ open, onOpenChange }: EventSheetProps) {
  const { toast } = useToast();
  const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock submission
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      toast({
        title: 'Event Created',
        description: 'The new custody event has been added to the schedule.',
      });
    }, 1500);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Create New Event</SheetTitle>
            <SheetDescription>
              Add a new event to the custody schedule.
            </SheetDescription>
          </SheetHeader>
          <Tabs defaultValue="one-time" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one-time">One-Time</TabsTrigger>
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
            </TabsList>
            <TabsContent value="one-time">
              <form onSubmit={handleSubmit} className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input id="title" placeholder="e.g., School Drop-off" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent">Parent</Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent-a">Parent A</SelectItem>
                        <SelectItem value="parent-b">Parent B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input id="start-time" type="time" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input id="end-time" type="time" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="e.g., 123 Main St" required />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="handover" />
                  <Label htmlFor="handover">Is this a handover event?</Label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSuggestionModalOpen(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-accent" />
                  Suggest Handover Time
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea id="description" placeholder="Add any extra details" />
                </div>
                
                <SheetFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-white">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Event
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
              <Sparkles className="w-5 h-5 text-accent" />
              Suggest Optimal Handover Time
            </DialogTitle>
            <DialogDescription>
              Let AI find the best time for a handover, considering traffic and
              other factors.
            </DialogDescription>
          </DialogHeader>
          <SuggestionForm
            onSuggestion={(time) => {
              // This would update the form fields in a real implementation
              toast({
                title: "Time Updated",
                description: `Event time has been set to the AI's suggestion: ${time}`,
              });
              setSuggestionModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
