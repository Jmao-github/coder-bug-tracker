import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useProfile } from './ProfileContext';

const ProfileIndicator: React.FC = () => {
  const { activeProfile, setShowProfileSelector } = useProfile();
  
  if (!activeProfile) return null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeProfile.avatarSeed}`} 
              alt={activeProfile.name} 
            />
            <AvatarFallback>{activeProfile.name[0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{activeProfile.name}</p>
            <p className="text-xs text-secondary-light">{activeProfile.role}</p>
          </div>
        </div>
        <DropdownMenuItem onClick={() => setShowProfileSelector(true)}>
          Switch profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileIndicator; 