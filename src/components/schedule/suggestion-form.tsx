'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { suggestOptimalMeetingTimes } from '@/app/actions';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  startLocation: z.string().min(1, 'Le lieu de départ est requis.'),
  endLocation: z.string().min(1, 'Le lieu de destination est requis.'),
  date: z.string().min(1, 'La date est requise.'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format de l\'heure invalide.'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format de l\'heure invalide.'),
});

type SuggestionFormValues = z.infer<typeof formSchema>;

interface SuggestionResult {
  suggestedTime: string;
  reason: string;
}

interface SuggestionFormProps {
  onSuggestion: (time: string) => void;
}

export function SuggestionForm({ onSuggestion }: SuggestionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestionResult | null>(null);

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '17:00',
      endTime: '19:00',
      startLocation: '',
      endLocation: '',
    },
  });

  const onSubmit = async (values: SuggestionFormValues) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const input = {
      ...values,
      date: new Date(values.date),
    };

    const response = await suggestOptimalMeetingTimes(input);

    if (response.error) {
      setError(response.error);
    } else if (response.success && response.data) {
      setResult(response.data);
    }
    setLoading(false);
  };

  const handleAcceptSuggestion = () => {
    if (result) {
        const suggestedTime = new Date(result.suggestedTime);
        onSuggestion(format(suggestedTime, 'HH:mm'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu de départ</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Maison du Parent 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu de destination</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: École" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure la plus proche</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure la plus tardive</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {result && (
            <Alert variant="default" className="border-primary text-primary-foreground">
                <AlertTitle>Suggestion trouvée !</AlertTitle>
                <AlertDescription>
                    <p className="font-bold">Heure suggérée : {format(new Date(result.suggestedTime), 'p', { locale: fr })}</p>
                    <p className="text-xs">{result.reason}</p>
                </AlertDescription>
            </Alert>
        )}

        <div className="flex justify-end pt-4 space-x-2">
            {!result && (
                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Obtenir une suggestion
                </Button>
            )}
             {result && (
                <Button type="button" onClick={handleAcceptSuggestion} className="w-full bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-white">
                    Accepter la suggestion
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
