
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  return (
    <header className="bg-white py-4 px-6 flex justify-between items-center rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-white font-semibold text-lg">IM</span>
        </div>
        <h1 className="text-xl font-semibold">Issue Manager</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-status-pending text-white">
              4
            </Badge>
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=manager" alt="CM" />
            <AvatarFallback>CM</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">Community Manager</p>
            <p className="text-xs text-secondary-light">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
