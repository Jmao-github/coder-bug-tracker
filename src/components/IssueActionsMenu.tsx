import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IssueActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const IssueActionsMenu: React.FC<IssueActionsMenuProps> = ({ onEdit, onDelete }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit} className="flex items-center gap-2">
          <Edit className="h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 text-red-600 focus:text-red-700">
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default IssueActionsMenu; 