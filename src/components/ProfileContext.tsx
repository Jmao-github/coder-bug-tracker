import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define the profile structure
export interface Profile {
  name: string;
  role: string;
  avatarSeed: string;
}

// Preset profiles
export const PROFILES: Profile[] = [
  { name: 'Jason', role: 'Product', avatarSeed: 'jason-product' },
  { name: 'Jaye', role: 'Marketing', avatarSeed: 'jaye-marketing' },
  { name: 'Kai', role: 'Engineering', avatarSeed: 'kai-engineering' }
];

// Context type
interface ProfileContextType {
  activeProfile: Profile | null;
  profile: Profile | null; // Alias for activeProfile for backward compatibility
  setActiveProfile: (profile: Profile) => void;
  showProfileSelector: boolean;
  setShowProfileSelector: (show: boolean) => void;
}

// Create context
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component
export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState<boolean>(false);
  
  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('activeProfile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile) as Profile;
        setActiveProfileState(profile);
      } catch (e) {
        console.error('Failed to parse saved profile', e);
        setShowProfileSelector(true);
      }
    } else {
      // No saved profile, show selector
      setShowProfileSelector(true);
    }
  }, []);

  // Handle setting active profile
  const setActiveProfile = async (profile: Profile) => {
    // Save to localStorage
    localStorage.setItem('activeProfile', JSON.stringify(profile));
    
    // Try to save to Supabase for logging (but don't block on errors)
    try {
      // Note: There appears to be a type mismatch with the 'user_sessions' table
      // Using type assertion to bypass TypeScript errors
      const supabaseAny = supabase as any;
      await supabaseAny.from('user_sessions').insert({
        profile_name: profile.name,
        profile_role: profile.role
      });
    } catch (error) {
      // Just log the error but don't prevent the user from using the app
      console.warn('Failed to save profile to Supabase', error);
      // This is expected if the table doesn't exist yet
    }
    
    // Update state
    setActiveProfileState(profile);
    setShowProfileSelector(false);
  };

  return (
    <ProfileContext.Provider value={{
      activeProfile,
      profile: activeProfile, // Add the alias
      setActiveProfile,
      showProfileSelector,
      setShowProfileSelector
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

// Custom hook for using profile context
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}; 