import { CustodyEvent } from './types';
import { addDays, setHours, setMinutes, startOfToday } from 'date-fns';

const today = startOfToday();

export const mockEvents: CustodyEvent[] = [
  {
    id: '1',
    title: "Dépôt à l'école",
    start: setMinutes(setHours(today, 8), 30),
    end: setMinutes(setHours(today, 9), 0),
    parent: 'Parent 1',
    location: '123 Rue Principale, Anytown, USA',
    description: 'Dépôt à l\'école primaire.',
    isHandover: true,
  },
  {
    id: '2',
    title: "Weekend avec Parent 2",
    start: setMinutes(setHours(addDays(today, 2), 18), 0),
    end: setMinutes(setHours(addDays(today, 4), 18), 0),
    parent: 'Parent 2',
    location: '456 Avenue du Chêne, Othertown, USA',
    description: 'Garde complète du week-end.',
    isHandover: true,
  },
    {
    id: '3',
    title: 'Entraînement de foot',
    start: setMinutes(setHours(today, 16), 0),
    end: setMinutes(setHours(today, 17), 30),
    parent: 'Parent 1',
    location: 'Parc municipal, Terrain 4',
    description: 'Entraînement de foot hebdomadaire.',
    isHandover: false,
  },
  {
    id: '4',
    title: "Dîner en milieu de semaine",
    start: setMinutes(setHours(addDays(today, -2), 18), 0),
    end: setMinutes(setHours(addDays(today, -2), 20), 0),
    parent: 'Parent 2',
    location: "Résidence du Parent 2",
    description: "Dîner avec le Parent 2.",
    isHandover: true,
  },
  {
    id: '5',
    title: "Weekend avec Parent 1",
    start: setMinutes(setHours(addDays(today, 9), 18), 0),
    end: setMinutes(setHours(addDays(today, 11), 18), 0),
    parent: 'Parent 1',
    location: "Résidence du Parent 1",
    description: 'Garde complète du week-end.',
    isHandover: true,
  },
];
