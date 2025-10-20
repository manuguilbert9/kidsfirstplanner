'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, Timestamp, collection, getDocs, query, where, updateDoc, arrayUnion } from 'firebase/firestore';
import type { ParentRole, RecurringSchedule, UserProfileData, CustodyOverride, GroupMember } from '@/lib/types';
import { useColors } from './use-colors';
import { v4 as uuidv4 } from 'uuid';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/lib/errors';


interface UserProfile {
  parentNames: Record<ParentRole, string> | null;
  groupId: string | null;
  parentRole: ParentRole | null;
  parentColor: string | null;
  recurringSchedule: RecurringSchedule | null;
  custodyOverrides: CustodyOverride[];
  members: GroupMember[];
}
interface AuthContextType {
  user: User | null;
  loading: boolean;
  groupId: string | null;
  parentRole: ParentRole | null;
  parentColor: string | null;
  recurringSchedule: RecurringSchedule | null;
  custodyOverrides: CustodyOverride[];
  members: GroupMember[];
  createGroup: (userId: string, groupName: string) => Promise<string | undefined>;
  joinGroup: (userId: string, groupId: string) => Promise<boolean>;
  updateParentRole: (userId: string, role: ParentRole) => Promise<void>;
  updateRecurringSchedule: (schedule: RecurringSchedule) => Promise<void>;
  updateParentColor: (userId: string, color: string) => Promise<void>;
  addCustodyOverride: (override: Omit<CustodyOverride, 'id'>) => Promise<void>;
  getFirstName: (role: ParentRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    groupId: null, 
    parentRole: null, 
    recurringSchedule: null,
    parentColor: null,
    custodyOverrides: [],
    members: [],
  });

  const { setParent1Color, setParent2Color } = useColors();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        setUserProfile({ groupId: null, parentRole: null, recurringSchedule: null, parentColor: null, custodyOverrides: [], members: [] });
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    };

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      const userData = docSnap.data() as UserProfileData;
      const currentGroupId = userData?.groupId || null;
      
      setUserProfile(prev => ({
        ...prev,
        groupId: currentGroupId,
        parentRole: userData?.parentRole || null,
        parentColor: userData?.color || null
      }));

      if (currentGroupId) {
         const groupUsersQuery = query(collection(db, 'users'), where('groupId', '==', currentGroupId));
         
         const unsubscribeGroupUsers = onSnapshot(groupUsersQuery, (querySnapshot) => {
            const members: GroupMember[] = [];
            querySnapshot.forEach((doc) => {
                const memberData = doc.data() as UserProfileData;
                 if (memberData.parentRole === 'Parent 1') {
                    setParent1Color(memberData.color || null);
                } else if (memberData.parentRole === 'Parent 2') {
                    setParent2Color(memberData.color || null);
                }
                members.push({
                  uid: doc.id,
                  ...memberData
                })
            });
            setUserProfile(prev => ({ ...prev, members }));
         }, async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: groupUsersQuery.converter?.toString() ?? 'users', // Approximation
              operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
         });

         const groupDocRef = doc(db, 'groups', currentGroupId);
         const unsubscribeGroup = onSnapshot(groupDocRef, (groupDoc) => {
            const groupData = groupDoc.data();

            let schedule: RecurringSchedule | null = null;
            if (groupData?.recurringSchedule) {
                const { startDate, ...rest } = groupData.recurringSchedule;
                schedule = {
                    ...rest,
                    startDate: (startDate as Timestamp).toDate(),
                };
            }
            
            let overrides: CustodyOverride[] = [];
            if (groupData?.custodyOverrides) {
              overrides = groupData.custodyOverrides.map((o: any) => ({
                ...o,
                id: o.id || uuidv4(),
                startDate: (o.startDate as Timestamp).toDate(),
                endDate: (o.endDate as Timestamp).toDate(),
              }));
            }

            setUserProfile(prev => ({ ...prev, recurringSchedule: schedule, custodyOverrides: overrides }));
            setLoading(false);
         }, async (serverError) => {
             const permissionError = new FirestorePermissionError({
                path: groupDocRef.path,
                operation: 'get',
              } satisfies SecurityRuleContext);
             errorEmitter.emit('permission-error', permissionError);
             setLoading(false);
         });

         return () => {
            unsubscribeGroupUsers();
            unsubscribeGroup();
         }
      } else {
        setUserProfile(prev => ({...prev, recurringSchedule: null, custodyOverrides: [], members: []}));
        setLoading(false);
      }

    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'get',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, [user, setParent1Color, setParent2Color]);

  const createGroup = async (userId: string, groupName: string) => {
    if (!user) throw new Error("Utilisateur non authentifié");
    const groupId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupDocRef = doc(db, 'groups', groupId);
    const userDocRef = doc(db, 'users', userId);
    const groupData = { name: groupName, members: [userId], custodyOverrides: [] };
    const defaultColor = '220 70% 50%';
    const userData = { groupId, parentRole: 'Parent 1', color: defaultColor, displayName: user.displayName };

    setDoc(groupDocRef, groupData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: groupDocRef.path,
            operation: 'create',
            requestResourceData: groupData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
    
    setDoc(userDocRef, userData, { merge: true }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: userData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
    
    return groupId;
  };

  const joinGroup = async (userId: string, groupIdToJoin: string) => {
    if (!user) throw new Error("Utilisateur non authentifié");
    const groupDocRef = doc(db, 'groups', groupIdToJoin);
    
    try {
        const groupDoc = await getDoc(groupDocRef);
        if (groupDoc.exists()) {
          const members = groupDoc.data().members || [];
          if (!members.includes(userId)) {
            const groupUpdateData = { members: arrayUnion(userId) };
            updateDoc(groupDocRef, groupUpdateData).catch(async (serverError) => {
              const permissionError = new FirestorePermissionError({
                  path: groupDocRef.path,
                  operation: 'update',
                  requestResourceData: groupUpdateData,
              } satisfies SecurityRuleContext);
              errorEmitter.emit('permission-error', permissionError);
            });
          }
          const defaultColor = '160 60% 45%';
          const userDocRef = doc(db, 'users', userId);
          const userData = { groupId: groupIdToJoin, parentRole: 'Parent 2', color: defaultColor, displayName: user.displayName };
          setDoc(userDocRef, userData, { merge: true }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: userData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
          });
          return true;
        }
        return false;
    } catch(e) {
      // This could be a permission error on getDoc
      const permissionError = new FirestorePermissionError({
        path: groupDocRef.path,
        operation: 'get',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      return false;
    }
  };

  const updateParentRole = async (userId: string, role: ParentRole) => {
    const userDocRef = doc(db, 'users', userId);
    const data = { parentRole: role };
    setDoc(userDocRef, data, { merge: true }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const updateParentColor = async (userId: string, color: string) => {
    const userDocRef = doc(db, 'users', userId);
    const data = { color: color };
    setDoc(userDocRef, data, { merge: true }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  }

  const updateRecurringSchedule = async (schedule: RecurringSchedule) => {
    if (!userProfile.groupId) throw new Error("L'utilisateur n'est pas dans un groupe.");
    
    const groupDocRef = doc(db, 'groups', userProfile.groupId);
    const data = { recurringSchedule: schedule };
    setDoc(groupDocRef, data, { merge: true }).catch(async (serverError) => {
       const permissionError = new FirestorePermissionError({
          path: groupDocRef.path,
          operation: 'update',
          requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  }

  const addCustodyOverride = async (override: Omit<CustodyOverride, 'id'>) => {
    if (!userProfile.groupId) throw new Error("L'utilisateur n'est pas dans un groupe.");

    const newOverride: CustodyOverride = {
      ...override,
      id: uuidv4(),
    };

    const groupDocRef = doc(db, 'groups', userProfile.groupId);
    const data = { custodyOverrides: arrayUnion(newOverride) };
    updateDoc(groupDocRef, data).catch(async (serverError) => {
       const permissionError = new FirestorePermissionError({
          path: groupDocRef.path,
          operation: 'update',
          requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const getFirstName = useCallback((role: ParentRole) => {
      const member = userProfile.members.find(m => m.parentRole === role);
      if (member && member.displayName) {
          return member.displayName.split(' ')[0];
      }
      return role;
  }, [userProfile.members]);


  const value = { 
    user, 
    loading, 
    groupId: userProfile.groupId, 
    parentRole: userProfile.parentRole, 
    parentColor: userProfile.parentColor,
    recurringSchedule: userProfile.recurringSchedule,
    custodyOverrides: userProfile.custodyOverrides,
    members: userProfile.members,
    createGroup, 
    joinGroup, 
    updateParentRole,
    updateRecurringSchedule,
    updateParentColor,
    addCustodyOverride,
    getFirstName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
