import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { db, doc, getDoc } from '../lib/firebase';
import { UserProfile } from '../types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data() as UserProfile;
        
        // Essential data loaded, set profile immediately
        setProfile(userData);
        setLoading(false);

        // Background task for non-essential data (admin check)
        (async () => {
          try {
            const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
            if (settingsDoc.exists()) {
              const settings = settingsDoc.data();
              if (settings.adminEmail && userData.email === settings.adminEmail) {
                setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
              }
            } else if (userData.email === 'volckastudio@gmail.com') {
              setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
            }
          } catch (e) {
            console.error("Error fetching settings for admin check:", e);
            if (userData.email === 'volckastudio@gmail.com') {
              setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
            }
          }
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {loading ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
          <div className="w-16 h-16 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-bold animate-pulse">جاري التحميل...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
