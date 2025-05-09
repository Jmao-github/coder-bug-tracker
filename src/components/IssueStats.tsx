
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const issuesData = [
  { name: 'Apr 22', issues: 1 },
  { name: 'Apr 23', issues: 0 },
  { name: 'Apr 24', issues: 2 },
  { name: 'Apr 25', issues: 1 },
  { name: 'Apr 26', issues: 0 },
  { name: 'Apr 27', issues: 0 },
  { name: 'Apr 28', issues: 4 },
];

const IssueStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Total Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2">
            <div className="text-4xl font-bold">8</div>
            <div className="text-status-critical flex items-center text-xs mb-1">
              <ArrowUp className="h-3 w-3" />
              <span>100%</span>
            </div>
          </div>
          <p className="text-sm text-secondary-light mt-1">vs. previous week</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Resolution Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2">
            <div className="text-4xl font-bold">0%</div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-secondary-light">In progress</span>
              <span className="text-xs font-medium">0/8</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Issues Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={issuesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 5]} 
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="issues"
                  name="New Issues"
                  stroke="#9b87f5"
                  strokeWidth={2}
                  activeDot={{ r: 4 }}
                  dot={{ strokeWidth: 2, r: 4 }}
                  fill="rgba(155, 135, 245, 0.1)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueStats;
