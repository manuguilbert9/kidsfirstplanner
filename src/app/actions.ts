'use server';

import {
  suggestOptimalMeetingTimes as suggestOptimalMeetingTimesFlow,
  type SuggestOptimalMeetingTimesInput,
} from '@/ai/flows/suggest-optimal-meeting-times';
import { z } from 'zod';

const SuggestOptimalMeetingTimesServerInput = z.object({
  startLocation: z.string().min(1, 'Le lieu de départ est requis.'),
  endLocation: z.string().min(1, 'Le lieu d\'arrivée est requis.'),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format de l\'heure de début invalide.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format de l\'heure de fin invalide.'),
});

export async function suggestOptimalMeetingTimes(input: unknown) {
  const parsedInput = SuggestOptimalMeetingTimesServerInput.safeParse(input);
  if (!parsedInput.success) {
    return { error: 'Entrée invalide.', details: parsedInput.error.format() };
  }

  const { date, startTime, endTime, startLocation, endLocation } = parsedInput.data;

  const startDateTime = new Date(date);
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(date);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  if (startDateTime >= endDateTime) {
    return { error: 'L\'heure de début doit être antérieure à l\'heure de fin.' };
  }

  const flowInput: SuggestOptimalMeetingTimesInput = {
    startLocation,
    endLocation,
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
  };

  try {
    const result = await suggestOptimalMeetingTimesFlow(flowInput);
    return { success: true, data: result };
  } catch (e) {
    console.error(e);
    return { error: 'Échec de l\'obtention de la suggestion de l\'IA. Veuillez réessayer plus tard.' };
  }
}
