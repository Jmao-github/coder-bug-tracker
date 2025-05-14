import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, CheckSquare, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface IssueStatsProps {
  counts: Record<string, number>;
  filteredCount?: number;
}

const IssueStats: React.FC<IssueStatsProps> = ({ counts, filteredCount }) => {
  // Calculate total issues across all segments
  const totalIssues = Object.values(counts || {}).reduce((sum, count) => sum + count, 0);
  
  // Calculate percentage change (dummy values for demo)
  const changePercentage = totalIssues > 0 ? 12.5 : 0; // In a real app, this would be calculated from historical data
  
  // Count issues with critical status (hardcoded to 1 for now)
  // In a real implementation, this would be fetched from the database
  const criticalCount = totalIssues > 0 ? 1 : 0;
  
  // Count issues in progress (for now, this is just the filtered count or the best guess)
  const inProgressCount = filteredCount !== undefined ? filteredCount : (totalIssues > 0 ? 2 : 0);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Card className="bg-white/80 shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-3 flex items-center gap-2">
          <motion.div
            key={totalIssues}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold"
          >
            {totalIssues}
          </motion.div>
          <div className="text-xs text-secondary-light">
            Total Issues
          </div>
          {changePercentage > 0 && (
            <div className="text-status-critical flex items-center text-xs">
              <ArrowUp className="h-3 w-3" />
              <span>{changePercentage}%</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-white/80 shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-3 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <CheckSquare className="h-4 w-4 text-status-solved" />
            <div className="text-xl font-bold">
              {filteredCount !== undefined && totalIssues > 0
                ? `${Math.round((filteredCount / totalIssues) * 100)}%`
                : "0%"}
            </div>
          </div>
          <div className="text-xs text-secondary-light">
            Filtered/Total Ratio
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-3 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <div className="text-xl font-bold">
              {inProgressCount}
            </div>
          </div>
          <div className="text-xs text-secondary-light">
            {filteredCount !== undefined ? "Filtered Count" : "In Progress"}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-3 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-status-critical" />
            <div className="text-xl font-bold">{criticalCount}</div>
          </div>
          <div className="text-xs text-secondary-light">
            Critical
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueStats;
