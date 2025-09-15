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
