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
  firstName?: string; // User's chosen first name for the app
}

export type GroupMember = UserProfileData & {
  uid: string;
}

// New type for group data to store parent names
export interface GroupData {
  name: string;
  members: string[];
  custodyOverrides: any[];
  recurringSchedule?: any;
  parentNames?: {
    'Parent 1'?: string;  // First name of Parent 1
    'Parent 2'?: string;  // First name of Parent 2
  };
}
