'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '../ui/switch';
import type { ParentRole } from '@/lib/types';

const formSchema = z.object({
  alternatingWeekDay: z.coerce.number().min(1).max(7),
  handoverTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format de l\'heure invalide.'),
  startDate: z.string().min(1, 'La date de début est requise.'),
  invertParents: z.boolean(),
});

type RecurringFormValues = z.infer<typeof formSchema>;

interface RecurringEventFormProps {
  onSave: () => void;
}

const weekdays = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

export function RecurringEventForm({ onSave }: RecurringEventFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { updateRecurringSchedule, recurringSchedule } = useAuth();
  const [parentA, setParentA] = useState<ParentRole>('Parent 1');

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alternatingWeekDay: 3, // Mercredi
      handoverTime: '18:00',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      invertParents: false,
    },
  });
  
  const invertParents = form.watch('invertParents');

  useEffect(() => {
    setParentA(invertParents ? 'Parent 2' : 'Parent 1');
  }, [invertParents]);

  useEffect(() => {
    if (recurringSchedule) {
      const inverted = recurringSchedule.parentA === 'Parent 2';
      form.reset({
        alternatingWeekDay: recurringSchedule.alternatingWeekDay,
        handoverTime: recurringSchedule.handoverTime,
        startDate: format(new Date(recurringSchedule.startDate), 'yyyy-MM-dd'),
        invertParents: inverted,
      });
    }
  }, [recurringSchedule, form]);

  const onSubmit = async (values: RecurringFormValues) => {
    setLoading(true);
    try {
      await updateRecurringSchedule({
        alternatingWeekDay: values.alternatingWeekDay,
        handoverTime: values.handoverTime,
        startDate: new Date(values.startDate),
        parentA: values.invertParents ? 'Parent 2' : 'Parent 1',
        parentB: values.invertParents ? 'Parent 1' : 'Parent 2',
      });
      toast({
        title: 'Calendrier mis à jour',
        description: 'Le calendrier récurrent a été enregistré.',
      });
      onSave();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le calendrier récurrent.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="py-4 space-y-4">
        <FormField
          control={form.control}
          name="alternatingWeekDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jour de passation</FormLabel>
              <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le jour de la semaine pour la passation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {weekdays.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="handoverTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heure de passation</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de début</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
         <FormField
          control={form.control}
          name="invertParents"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Inverser les parents</FormLabel>
                 <p className="text-xs text-muted-foreground">
                    Le calendrier commencera avec le <strong>{parentA}</strong>.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 space-x-2">
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-white">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer le calendrier récurrent
          </Button>
        </div>
      </form>
    </Form>
  );
}
