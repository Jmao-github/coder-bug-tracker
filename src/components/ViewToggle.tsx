import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Rows } from "lucide-react";

interface ViewToggleProps {
  viewMode: 'card';
  onChange: (mode: 'card') => void;
}

const ViewToggle = ({ viewMode, onChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-secondary-light">View:</span>
      <ToggleGroup type="single" value="card">
        <ToggleGroupItem value="card" className="px-2 py-1">
          <Rows className="h-4 w-4 mr-1" />
          <span className="text-xs">Card</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ViewToggle;
