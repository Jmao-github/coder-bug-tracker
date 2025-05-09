
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp } from "lucide-react";

const IssueStats = () => {
  return (
    <div className="flex flex-wrap gap-2">
      <Card className="bg-white/80 shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-3 flex items-center gap-2">
          <div className="text-xl font-bold">8</div>
          <div className="text-xs text-secondary-light">
            Total Issues
          </div>
          <div className="text-status-critical flex items-center text-xs">
            <ArrowUp className="h-3 w-3" />
            <span>100%</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/80 shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-3 flex items-center gap-2">
          <div className="text-xl font-bold">0%</div>
          <div className="text-xs text-secondary-light">
            Resolution Rate
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueStats;
