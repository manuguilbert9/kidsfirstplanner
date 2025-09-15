
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
  handoverTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format.'),
  startDate: z.string().min(1, 'Start date is required.'),
});

type RecurringFormValues = z.infer<typeof formSchema>;

interface RecurringEventFormProps {
  onSave: () => void;
}

const weekdays = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function RecurringEventForm({ onSave }: RecurringEventFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alternatingWeekDay: 5, // Friday
      handoverTime: '18:00',
      startDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (values: RecurringFormValues) => {
    setLoading(true);
    // In a real app, you'd save this to a database
    console.log('Recurring schedule submitted:', values);

    setTimeout(() => {
      setLoading(false);
      toast({
        title: 'Schedule Updated',
        description: 'The recurring schedule has been saved.',
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
              <FormLabel>Handover Day</FormLabel>
              <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the day of the week for handover" />
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
              <FormLabel>Handover Time</FormLabel>
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
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <p className="text-xs text-muted-foreground">
            The schedule will alternate weekly between Parent A and Parent B, starting from the specified date.
        </p>

        <div className="flex justify-end pt-4 space-x-2">
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-white">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Recurring Schedule
          </Button>
        </div>
      </form>
    </Form>
  );
}
