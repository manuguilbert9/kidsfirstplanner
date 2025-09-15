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
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import type { ParentRole } from '@/lib/types';

interface UserProfile {
  groupId: string | null;
  parentRole: ParentRole | null;
}
interface AuthContextType {
  user: User | null;
  loading: boolean;
  groupId: string | null;
  parentRole: ParentRole | null;
  createGroup: (userId: string, groupName: string) => Promise<string>;
  joinGroup: (userId: string, groupId: string) => Promise<boolean>;
  updateParentRole: (userId: string, role: ParentRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({ groupId: null, parentRole: null });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        setUserProfile({ groupId: null, parentRole: null });
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserProfile({
          groupId: data.groupId || null,
          parentRole: data.parentRole || null,
        });
      } else {
        setUserProfile({ groupId: null, parentRole: null });
      }
      setLoading(false);
    }, (error) => {
      console.error("Erreur d'écoute du profil utilisateur:", error);
      setLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  const createGroup = async (userId: string, groupName: string) => {
    const groupId = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(doc(db, 'groups', groupId), { name: groupName, members: [userId] });
    // Le créateur devient Parent 1 par défaut
    await setDoc(doc(db, 'users', userId), { groupId, parentRole: 'Parent 1' }, { merge: true });
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
      // Le deuxième membre devient Parent 2 par défaut
      await setDoc(doc(db, 'users', userId), { groupId: groupIdToJoin, parentRole: 'Parent 2' }, { merge: true });
      return true;
    }
    return false;
  };

  const updateParentRole = async (userId: string, role: ParentRole) => {
    await setDoc(doc(db, 'users', userId), { parentRole: role }, { merge: true });
  };
  
  const value = { 
    user, 
    loading, 
    groupId: userProfile.groupId, 
    parentRole: userProfile.parentRole, 
    createGroup, 
    joinGroup, 
    updateParentRole 
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
