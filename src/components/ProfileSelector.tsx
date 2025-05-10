import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile, PROFILES } from './ProfileContext';

const ProfileSelector: React.FC = () => {
  const { showProfileSelector, setActiveProfile } = useProfile();
  
  const handleSelectProfile = (profile: typeof PROFILES[0]) => {
    setActiveProfile(profile);
  };
  
  return (
    <Dialog open={showProfileSelector} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-4">
          <h2 className="text-xl font-bold">Select Your Profile</h2>
          <p className="text-secondary-light">Choose which team member you are</p>
          
          <div className="flex justify-center gap-8 mt-6">
            {PROFILES.map(profile => (
              <div 
                key={profile.name} 
                className="flex flex-col items-center space-y-2 cursor-pointer"
                onClick={() => handleSelectProfile(profile)}
              >
                <Avatar className="h-16 w-16 hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed}`} 
                    alt={profile.name} 
                  />
                  <AvatarFallback>{profile.name[0]}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <div className="font-medium">{profile.name}</div>
                  <div className="text-xs text-secondary-light">{profile.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSelector; 