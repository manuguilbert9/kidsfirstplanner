import { CustodyEvent } from './types';
import { addDays, setHours, setMinutes, startOfToday } from 'date-fns';

const today = startOfToday();

export const mockEvents: CustodyEvent[] = [
  {
    id: '1',
    title: "School Drop-off",
    start: setMinutes(setHours(today, 8), 30),
    end: setMinutes(setHours(today, 9), 0),
    parent: 'Parent A',
    location: '123 Main St, Anytown, USA',
    description: 'Drop off at elementary school.',
    isHandover: true,
  },
  {
    id: '2',
    title: "Weekend with Parent B",
    start: setMinutes(setHours(addDays(today, 2), 18), 0),
    end: setMinutes(setHours(addDays(today, 4), 18), 0),
    parent: 'Parent B',
    location: '456 Oak Ave, Othertown, USA',
    description: 'Full weekend custody.',
    isHandover: true,
  },
    {
    id: '3',
    title: 'Soccer Practice',
    start: setMinutes(setHours(today, 16), 0),
    end: setMinutes(setHours(today, 17), 30),
    parent: 'Parent A',
    location: 'Community Park, Field 4',
    description: 'Weekly soccer practice.',
    isHandover: false,
  },
  {
    id: '4',
    title: "Mid-week Dinner",
    start: setMinutes(setHours(addDays(today, -2), 18), 0),
    end: setMinutes(setHours(addDays(today, -2), 20), 0),
    parent: 'Parent B',
    location: "Parent B's Residence",
    description: "Dinner with Parent B.",
    isHandover: true,
  },
  {
    id: '5',
    title: "Weekend with Parent A",
    start: setMinutes(setHours(addDays(today, 9), 18), 0),
    end: setMinutes(setHours(addDays(today, 11), 18), 0),
    parent: 'Parent A',
    location: "Parent A's Residence",
    description: 'Full weekend custody.',
    isHandover: true,
  },
];
