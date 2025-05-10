import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tag, FileCode, Code, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from '@tanstack/react-query';
import { fetchIssuesByStatus } from '@/services/issueService';
import { Issue } from '@/types/issueTypes';
import { motion, AnimatePresence } from "framer-motion";

interface SegmentNavigationProps {
  activeSegment: string | null;
  onSegmentChange: (segment: string) => void;
  segmentCounts: Record<string, number>;
}

const CATEGORIES = [
  {
    id: 'auth',
    name: 'Auth & Login',
    icon: Tag,
    color: 'from-purple-500/20 to-indigo-400/20',
    borderColor: 'border-purple-400/40',
    accentColor: 'bg-purple-500',
    textColor: 'text-purple-700',
    tags: ['login-issue', 'email-', 'auth']
  },
  {
    id: 'code',
    name: 'Code Generation',
    icon: FileCode,
    color: 'from-blue-500/20 to-cyan-400/20',
    borderColor: 'border-blue-400/40',
    accentColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    tags: ['code-generation', 'session-']
  },
  {
    id: 'tool',
    name: 'Tool',
    icon: Code,
    color: 'from-green-500/20 to-emerald-400/20',
    borderColor: 'border-green-400/40',
    accentColor: 'bg-green-500',
    textColor: 'text-green-700',
    tags: ['tool', 'productivity']
  },
  {
    id: 'misc',
    name: 'Other',
    icon: HelpCircle,
    color: 'from-gray-400/20 to-gray-300/20',
    borderColor: 'border-gray-300/40',
    accentColor: 'bg-gray-500',
    textColor: 'text-gray-700',
    tags: []
  }
];

const SegmentNavigation: React.FC<SegmentNavigationProps> = ({ 
  activeSegment, 
  onSegmentChange, 
  segmentCounts 
}) => {
  const [prevCounts, setPrevCounts] = useState<Record<string, number>>(segmentCounts);
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, Record<string, number>>>({});

  // Get issue data for status breakdown in tooltips
  const { data: allIssues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => fetchIssuesByStatus('all'),
  });

  // Calculate status breakdown for tooltips
  useEffect(() => {
    if (allIssues.length > 0) {
      const breakdown: Record<string, Record<string, number>> = {};
      
      // Initialize the breakdown structure
      CATEGORIES.forEach(cat => {
        breakdown[cat.id] = {
          'pending': 0,
          'in-progress': 0,
          'blocked': 0,
          'solved': 0,
          'critical': 0,
          'WaitForHelp': 0,
          'InProgress': 0,
          'Resolved': 0,
          'Archived': 0,
          'Failed': 0
        };
      });
      
      // Count issues by segment and status
      allIssues.forEach((issue: Issue) => {
        const segment = issue.segment;
        
        if (segment in breakdown) {
          breakdown[segment][issue.status] = (breakdown[segment][issue.status] || 0) + 1;
        } else {
          breakdown['misc'][issue.status] = (breakdown['misc'][issue.status] || 0) + 1;
        }
      });
      
      setStatusBreakdown(breakdown);
    }
  }, [allIssues]);

  // Detect count changes for animation
  useEffect(() => {
    setPrevCounts(segmentCounts);
  }, [segmentCounts]);

  // Determine if count has changed for animation
  const hasCountChanged = (segment: string) => {
    return prevCounts[segment] !== segmentCounts[segment];
  };

  // Sort categories by count (descending)
  const sortedCategories = [...CATEGORIES].sort((a, b) => {
    const countA = segmentCounts[a.id] || 0;
    const countB = segmentCounts[b.id] || 0;
    return countB - countA;
  });

  // Generate status breakdown text for tooltip
  const getStatusBreakdownText = (segmentId: string) => {
    if (!statusBreakdown[segmentId]) return "No issues";
    
    const breakdown = statusBreakdown[segmentId];
    const statuses = Object.entries(breakdown)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => `${count} ${status}`)
      .join(', ');
    
    return statuses || "No issues";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {sortedCategories.map((segment) => {
        const count = segmentCounts[segment.id] || 0;
        const isZeroCount = count === 0;
        
        return (
          <TooltipProvider key={segment.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card 
                  onClick={() => onSegmentChange(segment.id)}
                  className={`cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md
                    bg-gradient-to-br ${segment.color} border ${segment.borderColor}
                    ${activeSegment === segment.id ? 'ring-2 ring-primary/50 shadow-lg' : ''}
                    ${isZeroCount ? 'opacity-60' : ''}
                  `}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center relative">
                    <segment.icon className={`h-10 w-10 mb-2 ${isZeroCount ? 'text-gray-400' : 'text-primary-dark/70'}`} />
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={count}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`text-4xl font-bold mb-1 ${isZeroCount ? 'text-gray-400' : ''}`}
                      >
                        {count}
                      </motion.div>
                    </AnimatePresence>
                    <div className="text-sm font-medium">{segment.name}</div>
                    
                    {/* Animated indicator for count changes */}
                    {hasCountChanged(segment.id) && (
                      <motion.div
                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${segment.accentColor}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.5, 1] }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="p-2">
                <p className="text-sm">
                  <span className={`font-semibold ${segment.textColor}`}>{segment.name}:</span>{" "}
                  {getStatusBreakdownText(segment.id)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

export default SegmentNavigation;
