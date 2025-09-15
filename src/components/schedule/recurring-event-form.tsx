
'use client';

import { useState } from 'react';
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

const formSchema = z.object({
  alternatingWeekDay: z.coerce.number().min(0).max(6),
  handoverTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format de l\'heure invalide.'),
  startDate: z.string().min(1, 'La date de début est requise.'),
});

type RecurringFormValues = z.infer<typeof formSchema>;

interface RecurringEventFormProps {
  onSave: () => void;
}

const weekdays = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

export function RecurringEventForm({ onSave }: RecurringEventFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alternatingWeekDay: 3, // Mercredi
      handoverTime: '18:00',
      startDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (values: RecurringFormValues) => {
    setLoading(true);
    // Dans une vraie application, vous enregistreriez cela dans une base de données
    console.log('Calendrier récurrent soumis :', values);

    setTimeout(() => {
      setLoading(false);
      toast({
        title: 'Calendrier mis à jour',
        description: 'Le calendrier récurrent a été enregistré.',
      });
      onSave();
    }, 1000);
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
              <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
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
        
        <p className="text-xs text-muted-foreground">
            Le calendrier alternera chaque semaine entre le Parent 1 et le Parent 2, à partir de la date spécifiée.
        </p>

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

    