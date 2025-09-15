export type CustodyEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  parent: 'Parent A' | 'Parent B';
  location: string;
  description: string;
  isHandover: boolean;
};

export type RecurringSchedule = {
  alternatingWeekDay: number; // 0 for Sunday, 1 for Monday, etc.
  handoverTime: string; // "HH:mm"
  parentA: 'Parent A';
  parentB: 'Parent B';
  startDate: Date;
};
