import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckSquare, XSquare, Archive, HelpCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Define the status types
type IssueStatus = 'waiting_for_help' | 'in_progress' | 'resolved' | 'blocked' | 'archived';

interface StatusTilesProps {
  statusCounts: Record<IssueStatus, number>;
  activeStatus: IssueStatus | null;
  onStatusChange: (status: IssueStatus | null) => void;
}

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverColor: string;
}

// Status configuration with colors and icons
const STATUS_CONFIG: Record<IssueStatus, StatusConfig> = {
  'in_progress': { 
    label: 'In Progress', 
    icon: <Clock className="h-4 w-4" />, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-50',
    hoverColor: 'hover:bg-yellow-100'
  },
  'waiting_for_help': { 
    label: 'Waiting for Help', 
    icon: <HelpCircle className="h-4 w-4" />, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-50',
    hoverColor: 'hover:bg-blue-100'
  },
  'blocked': { 
    label: 'Blocked', 
    icon: <XSquare className="h-4 w-4" />, 
    color: 'text-red-500', 
    bgColor: 'bg-red-50',
    hoverColor: 'hover:bg-red-100'
  },
  'resolved': { 
    label: 'Resolved', 
    icon: <CheckSquare className="h-4 w-4" />, 
    color: 'text-green-500', 
    bgColor: 'bg-green-50',
    hoverColor: 'hover:bg-green-100' 
  },
  'archived': { 
    label: 'Archived', 
    icon: <Archive className="h-4 w-4" />, 
    color: 'text-gray-500', 
    bgColor: 'bg-gray-50',
    hoverColor: 'hover:bg-gray-100' 
  },
};

const StatusTiles: React.FC<StatusTilesProps> = ({ 
  statusCounts, 
  activeStatus, 
  onStatusChange 
}) => {
  // Ensure we have a valid object to prevent errors
  const safeStatusCounts = statusCounts || {} as Record<IssueStatus, number>;
  
  // Total count for contextual info
  const totalIssues = Object.values(safeStatusCounts).reduce((sum, count) => sum + count, 0);
  
  // Function to handle status tile click
  const handleStatusClick = (status: IssueStatus) => {
    // If the status is not already active, set it
    if (activeStatus !== status) {
      onStatusChange(status);
    }
    // If status is already active, do nothing (no toggle)
  };

  // Function to clear the active filter
  const clearFilter = () => {
    onStatusChange(null);
  };
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = safeStatusCounts[status as IssueStatus] || 0;
          const isActive = activeStatus === status;
          const percentage = totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0;
          
          return (
            <Card 
              key={status}
              className={`
                cursor-pointer transition-all duration-300 overflow-hidden
                ${isActive 
                  ? `border-2 ${config.color} shadow-md` 
                  : 'border border-gray-200 opacity-80'
                }
                ${config.bgColor} ${config.hoverColor}
              `}
              onClick={() => handleStatusClick(status as IssueStatus)}
            >
              <CardContent className="p-3 flex flex-col items-center text-center">
                <div className={`${config.color} mt-1`}>
                  {config.icon}
                </div>
                <motion.div
                  key={`${status}-${count}`}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl font-bold mt-1"
                >
                  {count}
                </motion.div>
                <div className="text-xs mt-1">
                  {config.label}
                </div>
                {totalIssues > 0 && (
                  <div className={`text-xs mt-1 ${config.color}`}>
                    {percentage}%
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {activeStatus && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilter}
            className="text-xs flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear Filter
          </Button>
        </div>
      )}
    </div>
  );
};

export default StatusTiles; 