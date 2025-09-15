'use server';

import {
  suggestOptimalMeetingTimes as suggestOptimalMeetingTimesFlow,
  type SuggestOptimalMeetingTimesInput,
} from '@/ai/flows/suggest-optimal-meeting-times';
import { z } from 'zod';

const SuggestOptimalMeetingTimesServerInput = z.object({
  startLocation: z.string().min(1, 'Start location is required.'),
  endLocation: z.string().min(1, 'End location is required.'),
  date: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid start time format.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid end time format.'),
});

export async function suggestOptimalMeetingTimes(input: unknown) {
  const parsedInput = SuggestOptimalMeetingTimesServerInput.safeParse(input);
  if (!parsedInput.success) {
    return { error: 'Invalid input.', details: parsedInput.error.format() };
  }

  const { date, startTime, endTime, startLocation, endLocation } = parsedInput.data;

  const startDateTime = new Date(date);
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(date);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  if (startDateTime >= endDateTime) {
    return { error: 'Start time must be before end time.' };
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
    return { error: 'Failed to get suggestion from AI. Please try again later.' };
  }
}
