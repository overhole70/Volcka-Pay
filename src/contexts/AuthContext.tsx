import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { db, doc, getDoc, setDoc, getDocs, collection } from '../lib/firebase';
import { UserProfile } from '../types';
import { User } from '@supabase/supabase-js';
import { generateUniqueVolckaId } from '../lib/utils';

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

  const isFetchingRef = useRef(false);

  const fetchProfile = async (currentUser: User, retryCount = 0) => {
    if (isFetchingRef.current && retryCount === 0) {
      console.log(`[AuthContext] Fetch already in progress for ${currentUser.id}, skipping...`);
      return;
    }
    
    isFetchingRef.current = true;
    if (!profile) setLoading(true);
    
    try {
      console.log(`[AuthContext] Fetching profile for user.id: ${currentUser.id}`);
      
      // First try to get by ID
      let docRef = doc(db, 'users', currentUser.id);
      let docSnap = await getDoc(docRef);
      let userData: UserProfile | null = null;
      
      console.log(`[AuthContext] Firebase response exists by ID: ${docSnap.exists()}`);
      
      if (docSnap.exists()) {
        userData = docSnap.data() as UserProfile;
      } else {
        // If not found by ID, try to find by email or uid in all users
        console.log(`[AuthContext] Not found by ID, searching all users...`);
        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        
        const existingUser = allUsers.find((u: any) => 
          u.uid === currentUser.id || 
          (u.email && u.email.toLowerCase() === currentUser.email?.toLowerCase())
        );
        
        if (existingUser) {
          console.log(`[AuthContext] Found user by email/uid with doc ID: ${existingUser.id}`);
          userData = existingUser as UserProfile;
          docRef = doc(db, 'users', existingUser.id);
          
          // Update the document to ensure it has the correct uid
          if (userData.uid !== currentUser.id) {
            console.log(`[AuthContext] Updating user uid to match Supabase ID`);
            userData.uid = currentUser.id;
            await setDoc(docRef, userData);
          }
        }
      }
      
      if (userData) {
        console.log(`[AuthContext] Firebase response data:`, userData);
        
        // Handle empty response or missing fields
        if (Object.keys(userData).length === 0) {
          console.warn(`[AuthContext] Empty response for user ${currentUser.id}`);
          if (retryCount === 0) {
            console.log(`[AuthContext] Retrying fetch once...`);
            isFetchingRef.current = false;
            return fetchProfile(currentUser, 1);
          }
        }

        // Ensure all required fields exist
        const completeUserData: UserProfile = {
          uid: userData.uid || currentUser.id,
          email: userData.email || currentUser.email || '',
          fullName: userData.fullName || currentUser.user_metadata?.full_name || 'مستخدم',
          balance: userData.balance || 0,
          volckaId: userData.volckaId || await generateUniqueVolckaId(),
          createdAt: userData.createdAt || new Date().toISOString(),
          role: userData.role || 'user',
          ...userData // Keep any other existing fields
        };

        // If fields were missing, update the document
        if (!userData.uid || !userData.email || !userData.volckaId) {
          console.log(`[AuthContext] Updating document with missing fields`);
          await setDoc(docRef, completeUserData);
        }

        // Essential data loaded, set profile immediately
        setProfile(completeUserData);
        setLoading(false);
        isFetchingRef.current = false;

        // Background task for non-essential data (admin check)
        (async () => {
          try {
            const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
            if (settingsDoc.exists()) {
              const settings = settingsDoc.data();
              if (settings.adminEmail && completeUserData.email === settings.adminEmail) {
                setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
              }
            } else if (completeUserData.email === 'volckastudio@gmail.com') {
              setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
            }
          } catch (e) {
            console.error("Error fetching settings for admin check:", e);
            if (completeUserData.email === 'volckastudio@gmail.com') {
              setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
            }
          }
        })();
      } else {
        // Create profile if it doesn't exist
        console.log(`[AuthContext] Profile does not exist, creating new profile for ${currentUser.id}`);
        const volckaId = await generateUniqueVolckaId();
        const newUserProfile: UserProfile = {
          uid: currentUser.id,
          email: currentUser.email || '',
          fullName: currentUser.user_metadata?.full_name || 'مستخدم',
          balance: 0,
          volckaId,
          createdAt: new Date().toISOString(),
          role: 'user'
        };
        
        await setDoc(docRef, newUserProfile);
        setProfile(newUserProfile);
        setLoading(false);
        isFetchingRef.current = false;
      }
    } catch (error) {
      console.error(`[AuthContext] Error fetching profile for ${currentUser.id}:`, error);
      if (retryCount === 0) {
        console.log(`[AuthContext] Retrying fetch once after error...`);
        isFetchingRef.current = false;
        return fetchProfile(currentUser, 1);
      }
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        // Clear all user-specific OTP verifications
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('otpVerified_')) {
            localStorage.removeItem(key);
          }
        });
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Clear all user-specific OTP verifications
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('otpVerified_')) {
        localStorage.removeItem(key);
      }
    });
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
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
