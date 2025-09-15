'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  groupId: string | null;
  setGroupId: (groupId: string | null) => void;
  createGroup: (userId: string, groupName: string) => Promise<string>;
  joinGroup: (userId: string, groupId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().groupId) {
          setGroupId(userDoc.data().groupId);
        } else {
          setGroupId(null);
        }
      } else {
        setGroupId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createGroup = async (userId: string, groupName: string) => {
    const groupId = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(doc(db, 'groups', groupId), { name: groupName, members: [userId] });
    await setDoc(doc(db, 'users', userId), { groupId }, { merge: true });
    setGroupId(groupId);
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
      await setDoc(doc(db, 'users', userId), { groupId: groupIdToJoin }, { merge: true });
      setGroupId(groupIdToJoin);
      return true;
    }
    return false;
  };
  
  const value = { user, loading, groupId, setGroupId, createGroup, joinGroup };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
