import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';
import { getUserProfile, saveUserProfile } from '../services/firestoreService.js';
import type { UserProfile } from '../types/index.js';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isDemoUser: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_PROFILE: UserProfile = {
  uid: 'demo-user-101',
  email: 'founder@leadforge.ai',
  displayName: 'Alex Vance',
  photoURL: '/src/assets/images/leadforge_user_avatar_1791391664859.jpg',
  plan: 'pro',
  company: 'LeadForge Growth Labs',
  createdAt: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('leadforge_demo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('leadforge_demo_user'));
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsDemoUser(false);
        localStorage.removeItem('leadforge_demo_user');
        try {
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            profile = {
              uid: user.uid,
              email: user.email || 'user@leadforge.ai',
              displayName: user.displayName || user.email?.split('@')[0] || 'Sales Operator',
              photoURL: user.photoURL || undefined,
              plan: 'pro',
              company: 'My Sales Workspace',
              createdAt: new Date().toISOString()
            };
            await saveUserProfile(profile);
          }
          setCurrentUser(profile);
        } catch (err) {
          console.warn('Could not sync user profile with Firestore, using local state:', err);
          setCurrentUser({
            uid: user.uid,
            email: user.email || 'user@leadforge.ai',
            displayName: user.displayName || 'Sales Operator',
            photoURL: user.photoURL || undefined,
            plan: 'pro',
            company: 'My Sales Workspace',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setFirebaseUser(null);
        if (!localStorage.getItem('leadforge_demo_user')) {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = () => {
    localStorage.setItem('leadforge_demo_user', JSON.stringify(DEMO_USER_PROFILE));
    setCurrentUser(DEMO_USER_PROFILE);
    setIsDemoUser(true);
  };

  const logout = async () => {
    try {
      if (firebaseUser) {
        await fbSignOut(auth);
      }
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      localStorage.removeItem('leadforge_demo_user');
      setCurrentUser(null);
      setIsDemoUser(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        isDemoUser,
        loginWithGoogle,
        loginAsDemoUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
