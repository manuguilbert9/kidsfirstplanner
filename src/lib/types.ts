export type CustodyEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  parent: 'Parent 1' | 'Parent 2';
  location: string;
  description: string;
  isHandover: boolean;
};

export type RecurringSchedule = {
  alternatingWeekDay: number; // 0 for Sunday, 1 for Monday, etc.
  handoverTime: string; // "HH:mm"
  parentA: 'Parent 1';
  parentB: 'Parent 2';
  startDate: Date;
};
