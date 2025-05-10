import React, { useRef, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Clock, CheckSquare, XSquare, Archive, HelpCircle } from "lucide-react";

// Restricted status types
type IssueStatus = 'waiting_for_help' | 'in_progress' | 'resolved' | 'blocked' | 'archived';

interface StatusSelectorProps {
  currentStatus: string;
  statusClassName: string;
  statusIcon: React.ReactNode;
  statusText: string;
  onStatusChange: (newStatus: IssueStatus) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  currentStatus,
  statusClassName,
  statusIcon,
  statusText,
  onStatusChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Status options with their display properties
  const statusOptions: {id: IssueStatus, label: string, icon: React.ReactNode, className: string}[] = [
    { id: 'in_progress', label: 'In Progress', icon: <Clock className="h-4 w-4" />, className: 'bg-yellow-500 text-white' },
    { id: 'waiting_for_help', label: 'Waiting for Help', icon: <HelpCircle className="h-4 w-4" />, className: 'bg-blue-500 text-white' },
    { id: 'resolved', label: 'Resolved', icon: <CheckSquare className="h-4 w-4" />, className: 'bg-green-500 text-white' },
    { id: 'blocked', label: 'Blocked', icon: <XSquare className="h-4 w-4" />, className: 'bg-red-500 text-white' },
    { id: 'archived', label: 'Archived', icon: <Archive className="h-4 w-4" />, className: 'bg-gray-500 text-white' }
  ];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleStatusSelect = (status: IssueStatus) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div ref={triggerRef} onClick={handleClick}>
          <Badge className={`${statusClassName} flex items-center gap-1 cursor-pointer`}>
            {statusIcon}
            {statusText}
          </Badge>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            className="cursor-pointer"
            onClick={() => handleStatusSelect(option.id)}
          >
            <div className="flex items-center gap-2">
              <Badge className={option.className}>
                {option.icon}
                <span className="ml-1">{option.label}</span>
              </Badge>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatusSelector;
