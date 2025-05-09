
import React, { useRef, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Clock, CheckSquare, XSquare } from "lucide-react";

type IssueStatus = 'pending' | 'solved' | 'critical' | 'in-progress' | 'blocked';

interface StatusSelectorProps {
  currentStatus: IssueStatus;
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
    { id: 'pending', label: 'Pending', icon: <Clock className="h-4 w-4" />, className: 'bg-status-pending text-white' },
    { id: 'in-progress', label: 'In Progress', icon: <Clock className="h-4 w-4" />, className: 'bg-blue-500 text-white' },
    { id: 'blocked', label: 'Blocked', icon: <XSquare className="h-4 w-4" />, className: 'bg-orange-500 text-white' },
    { id: 'solved', label: 'Resolved', icon: <CheckSquare className="h-4 w-4" />, className: 'bg-status-solved text-white' },
    { id: 'critical', label: 'Critical', icon: <XSquare className="h-4 w-4" />, className: 'bg-status-critical text-white' }
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
              <Badge className={option.className} size="sm">
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
