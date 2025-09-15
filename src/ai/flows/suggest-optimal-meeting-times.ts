'use server';

/**
 * @fileOverview Suggests the optimal custody handover time considering road traffic, time of day, and location.
 *
 * - suggestOptimalMeetingTimes - A function that suggests the optimal custody handover time.
 * - SuggestOptimalMeetingTimesInput - The input type for the suggestOptimalMeetingTimes function.
 * - SuggestOptimalMeetingTimesOutput - The return type for the suggestOptimalMeetingTimes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalMeetingTimesInputSchema = z.object({
  startLocation: z.string().describe('The starting location for the handover.'),
  endLocation: z.string().describe('The ending location for the handover.'),
  startTime: z.string().describe('The preferred start time for the handover in ISO format (e.g., 2024-04-03T15:30:00Z).'),
  endTime: z.string().describe('The latest end time for the handover in ISO format (e.g., 2024-04-03T17:30:00Z).'),
});
export type SuggestOptimalMeetingTimesInput = z.infer<typeof SuggestOptimalMeetingTimesInputSchema>;

const SuggestOptimalMeetingTimesOutputSchema = z.object({
  suggestedTime: z.string().describe('The suggested optimal handover time in ISO format (e.g., 2024-04-03T16:00:00Z).'),
  reason: z.string().describe('The reason for suggesting this particular time.'),
});
export type SuggestOptimalMeetingTimesOutput = z.infer<typeof SuggestOptimalMeetingTimesOutputSchema>;

export async function suggestOptimalMeetingTimes(input: SuggestOptimalMeetingTimesInput): Promise<SuggestOptimalMeetingTimesOutput> {
  return suggestOptimalMeetingTimesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalMeetingTimesPrompt',
  input: {schema: SuggestOptimalMeetingTimesInputSchema},
  output: {schema: SuggestOptimalMeetingTimesOutputSchema},
  prompt: `You are an AI assistant that suggests the optimal custody handover time considering road traffic, time of day, and location.

  Given the following information, suggest the best handover time between the start and end times, and explain your reasoning.

  Start Location: {{{startLocation}}}
  End Location: {{{endLocation}}}
  Preferred Start Time: {{{startTime}}}
  Latest End Time: {{{endTime}}}
  
  Consider factors such as rush hour, typical traffic patterns for the given locations, and time of day.
`,
});

const suggestOptimalMeetingTimesFlow = ai.defineFlow(
  {
    name: 'suggestOptimalMeetingTimesFlow',
    inputSchema: SuggestOptimalMeetingTimesInputSchema,
    outputSchema: SuggestOptimalMeetingTimesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
