
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, Rows } from "lucide-react";

type ViewMode = 'card' | 'grid';

interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ViewToggle = ({ viewMode, onChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-secondary-light">View:</span>
      <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && onChange(value as ViewMode)}>
        <ToggleGroupItem value="card" className="px-2 py-1">
          <Rows className="h-4 w-4 mr-1" />
          <span className="text-xs">Card</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" className="px-2 py-1">
          <LayoutGrid className="h-4 w-4 mr-1" />
          <span className="text-xs">Grid</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ViewToggle;
