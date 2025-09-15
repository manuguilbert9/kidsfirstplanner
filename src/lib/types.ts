export type ParentRole = 'Parent 1' | 'Parent 2';

export type CustodyEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  parent: ParentRole;
  location: string;
  description: string;
  isHandover: boolean;
};

export type RecurringSchedule = {
  alternatingWeekDay: number; // 1 for Monday, etc.
  handoverTime: string; // "HH:mm"
  parentA: ParentRole;
  parentB: ParentRole;
  startDate: Date;
};

export type CustodyOverride = {
  id: string;
  startDate: Date;
  endDate: Date;
  parent: ParentRole;
  reason: string;
};

export interface UserProfileData {
  groupId: string;
  parentRole: ParentRole;
  color?: string;
  displayName?: string;
}

export type GroupMember = UserProfileData & {
  uid: string;
}
