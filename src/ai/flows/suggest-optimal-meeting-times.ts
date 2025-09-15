'use server';

/**
 * @fileOverview Suggère l'heure de passation de garde optimale en tenant compte du trafic routier, de l'heure de la journée et du lieu.
 *
 * - suggestOptimalMeetingTimes - Une fonction qui suggère l'heure de passation de garde optimale.
 * - SuggestOptimalMeetingTimesInput - Le type d'entrée pour la fonction suggestOptimalMeetingTimes.
 * - SuggestOptimalMeetingTimesOutput - Le type de retour pour la fonction suggestOptimalMeetingTimes.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalMeetingTimesInputSchema = z.object({
  startLocation: z.string().describe('Le lieu de départ pour la passation.'),
  endLocation: z.string().describe('Le lieu d\'arrivée pour la passation.'),
  startTime: z.string().describe('L\'heure de début préférée pour la passation au format ISO (ex: 2024-04-03T15:30:00Z).'),
  endTime: z.string().describe('L\'heure de fin la plus tardive pour la passation au format ISO (ex: 2024-04-03T17:30:00Z).'),
});
export type SuggestOptimalMeetingTimesInput = z.infer<typeof SuggestOptimalMeetingTimesInputSchema>;

const SuggestOptimalMeetingTimesOutputSchema = z.object({
  suggestedTime: z.string().describe('L\'heure de passation optimale suggérée au format ISO (ex: 2024-04-03T16:00:00Z).'),
  reason: z.string().describe('La raison de la suggestion de cette heure particulière.'),
});
export type SuggestOptimalMeetingTimesOutput = z.infer<typeof SuggestOptimalMeetingTimesOutputSchema>;

export async function suggestOptimalMeetingTimes(input: SuggestOptimalMeetingTimesInput): Promise<SuggestOptimalMeetingTimesOutput> {
  return suggestOptimalMeetingTimesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalMeetingTimesPrompt',
  input: {schema: SuggestOptimalMeetingTimesInputSchema},
  output: {schema: SuggestOptimalMeetingTimesOutputSchema},
  prompt: `Vous êtes un assistant IA qui suggère l'heure de passation de garde optimale en tenant compte du trafic routier, de l'heure de la journée et du lieu.

  Compte tenu des informations suivantes, suggérez la meilleure heure de passation entre les heures de début et de fin, et expliquez votre raisonnement.

  Lieu de départ: {{{startLocation}}}
  Lieu de destination: {{{endLocation}}}
  Heure de début préférée: {{{startTime}}}
  Heure de fin la plus tardive: {{{endTime}}}
  
  Tenez compte de facteurs tels que les heures de pointe, les schémas de circulation typiques pour les lieux donnés et l'heure de la journée.
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
