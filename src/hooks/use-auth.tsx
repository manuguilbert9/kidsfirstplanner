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
import { doc, getDoc, setDoc, onSnapshot, Timestamp, collection, getDocs, query, where } from 'firebase/firestore';
import type { ParentRole, RecurringSchedule, UserProfileData } from '@/lib/types';
import { useColors } from './use-colors';

interface UserProfile {
  groupId: string | null;
  parentRole: ParentRole | null;
  parentColor: string | null;
  recurringSchedule: RecurringSchedule | null;
}
interface AuthContextType {
  user: User | null;
  loading: boolean;
  groupId: string | null;
  parentRole: ParentRole | null;
  parentColor: string | null;
  recurringSchedule: RecurringSchedule | null;
  createGroup: (userId: string, groupName: string) => Promise<string>;
  joinGroup: (userId: string, groupId: string) => Promise<boolean>;
  updateParentRole: (userId: string, role: ParentRole) => Promise<void>;
  updateRecurringSchedule: (schedule: RecurringSchedule) => Promise<void>;
  updateParentColor: (userId: string, color: string) => Promise<void>;
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
  });

  const { setParent1Color, setParent2Color } = useColors();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        setUserProfile({ groupId: null, parentRole: null, recurringSchedule: null, parentColor: null });
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
            querySnapshot.forEach((doc) => {
                const memberData = doc.data() as UserProfileData;
                 if (memberData.parentRole === 'Parent 1') {
                    setParent1Color(memberData.color || null);
                } else if (memberData.parentRole === 'Parent 2') {
                    setParent2Color(memberData.color || null);
                }
            });
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
            setUserProfile(prev => ({ ...prev, recurringSchedule: schedule }));
            setLoading(false);
         }, (error) => {
             console.error("Erreur d'écoute du groupe:", error);
             setLoading(false);
         });

         return () => {
            unsubscribeGroupUsers();
            unsubscribeGroup();
         }
      } else {
        setUserProfile(prev => ({...prev, recurringSchedule: null}));
        setLoading(false);
      }

    }, (error) => {
      console.error("Erreur d'écoute du profil utilisateur:", error);
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, [user, setParent1Color, setParent2Color]);

  const createGroup = async (userId: string, groupName: string) => {
    const groupId = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(doc(db, 'groups', groupId), { name: groupName, members: [userId] });
    // Le créateur devient Parent 1 par défaut et se voit attribuer la première couleur par défaut
    const defaultColor = 'hsl(220 70% 50%)';
    await setDoc(doc(db, 'users', userId), { groupId, parentRole: 'Parent 1', color: defaultColor }, { merge: true });
    return groupId;
  };

  const joinGroup = async (userId: string, groupIdToJoin: string) => {
    const groupDocRef = doc(db, 'groups', groupIdToJoin);
    const groupDoc = await getDoc(groupDocRef);
    if (groupDoc.exists()) {
      const members = groupDoc.data().members || [];
      if (!members.includes(userId)) {
        await setDoc(groupDocRef, { members: [...members, userId] }, { merge: true });
      }
      // Le deuxième membre devient Parent 2 par défaut et se voit attribuer la deuxième couleur par défaut
      const defaultColor = 'hsl(160 60% 45%)';
      await setDoc(doc(db, 'users', userId), { groupId: groupIdToJoin, parentRole: 'Parent 2', color: defaultColor }, { merge: true });
      return true;
    }
    return false;
  };

  const updateParentRole = async (userId: string, role: ParentRole) => {
    await setDoc(doc(db, 'users', userId), { parentRole: role }, { merge: true });
  };
  
  const updateParentColor = async (userId: string, color: string) => {
    await setDoc(doc(db, 'users', userId), { color: color }, { merge: true });
  }

  const updateRecurringSchedule = async (schedule: RecurringSchedule) => {
    if (!userProfile.groupId) throw new Error("L'utilisateur n'est pas dans un groupe.");
    
    const groupDocRef = doc(db, 'groups', userProfile.groupId);
    await setDoc(groupDocRef, { recurringSchedule: schedule }, { merge: true });
  }
  
  const value = { 
    user, 
    loading, 
    groupId: userProfile.groupId, 
    parentRole: userProfile.parentRole, 
    parentColor: userProfile.parentColor,
    recurringSchedule: userProfile.recurringSchedule,
    createGroup, 
    joinGroup, 
    updateParentRole,
    updateRecurringSchedule,
    updateParentColor
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
