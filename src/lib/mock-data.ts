import { CustodyEvent } from './types';
import { addDays, setHours, setMinutes, startOfToday } from 'date-fns';

const today = startOfToday();

export const mockEvents: CustodyEvent[] = [];
