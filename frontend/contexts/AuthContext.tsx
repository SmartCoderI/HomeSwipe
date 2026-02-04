import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        console.log('✅ User logged in:', user.email);
      } else {
        console.log('👤 No user logged in');
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', result.user.email);
    } catch (error: any) {
      console.error('❌ Login error:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);

      // Check if username already exists
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      if (usernameDoc.exists()) {
        throw new Error('Username already taken');
      }

      // Create user account
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with username
      await updateProfile(result.user, {
        displayName: username
      });

      // Store username mapping in Firestore
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: result.user.uid,
        username: username,
        createdAt: new Date().toISOString()
      });

      // Create user profile document
      await setDoc(doc(db, 'users', result.user.uid), {
        username: username,
        email: email,
        createdAt: new Date().toISOString(),
        savedHomes: []
      });

      console.log('✅ Registration successful:', username);
    } catch (error: any) {
      console.error('❌ Registration error:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Logout successful');
    } catch (error: any) {
      console.error('❌ Logout error:', error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
