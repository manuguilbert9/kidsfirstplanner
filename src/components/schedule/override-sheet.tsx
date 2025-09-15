'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isBefore, addDays } from 'date-fns';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { ParentRole } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const formSchema = z.object({
  endDate: z.string().min(1, 'La date de fin est requise.'),
  parent: z.enum(['Parent 1', 'Parent 2'], { required_error: 'Veuillez sélectionner un parent.' }),
  reason: z.string().min(1, 'Le motif est requis.'),
});

type OverrideFormValues = z.infer<typeof formSchema>;

interface OverrideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date | null | undefined;
}

export function OverrideSheet({ open, onOpenChange, startDate }: OverrideSheetProps) {
  const { toast } = useToast();
  const { addCustodyOverride } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OverrideFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parent: 'Parent 1',
      reason: ''
    }
  });
  
  useEffect(() => {
    if (open && startDate) {
        form.setValue('endDate', format(startDate, 'yyyy-MM-dd'));
    }
     if (!open) {
      form.reset();
    }
  }, [startDate, open, form]);

  const handleSubmit = async (values: OverrideFormValues) => {
    if (!startDate) return;

    // The date from the input will be in local time, but at midnight. 
    // We create a date at noon to avoid timezone issues.
    const localEndDate = new Date(values.endDate);
    const endDate = new Date(localEndDate.getFullYear(), localEndDate.getMonth(), localEndDate.getDate(), 12, 0, 0);
    
    const localStartDate = new Date(startDate);
    const noonStartDate = new Date(localStartDate.getFullYear(), localStartDate.getMonth(), localStartDate.getDate(), 12, 0, 0);


     if (isBefore(endDate, noonStartDate)) {
      form.setError('endDate', { message: 'La date de fin ne peut pas être antérieure à la date de début.' });
      return;
    }

    setIsLoading(true);
    try {
      await addCustodyOverride({
        startDate: noonStartDate,
        endDate: endDate,
        parent: values.parent,
        reason: values.reason,
      });

      toast({
        title: 'Garde changée',
        description: 'La période de garde a été mise à jour.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la garde", error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de changer la garde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Changer la garde</SheetTitle>
          <SheetDescription>
            Définissez une période de garde exceptionnelle qui remplacera le calendrier récurrent.
          </SheetDescription>
        </SheetHeader>
        {startDate && (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date de début</Label>
                            <Input value={format(startDate, 'dd/MM/yyyy')} disabled />
                        </div>
                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Date de fin</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <FormField
                        control={form.control}
                        name="parent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parent ayant la garde</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner le parent" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Parent 1">Parent 1</SelectItem>
                                    <SelectItem value="Parent 2">Parent 2</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Motif</FormLabel>
                            <FormControl>
                                <Textarea placeholder="ex: Vacances scolaires, déplacement..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <SheetFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-white">
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Sauvegarder le changement
                    </Button>
                    </SheetFooter>
                </form>
            </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
