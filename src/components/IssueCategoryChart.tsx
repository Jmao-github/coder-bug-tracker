import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface IssueCategoryChartProps {
  counts: Record<string, number>;
}

const CATEGORY_COLORS = {
  'auth': '#A78BFA',
  'code': '#60A5FA',
  'tool': '#34D399',
  'misc': '#9CA3AF'
};

const CATEGORY_NAMES = {
  'auth': 'Auth & Login',
  'code': 'Code Generation',
  'tool': 'Tool',
  'misc': 'Other'
};

const IssueCategoryChart: React.FC<IssueCategoryChartProps> = ({ counts }) => {
  // Format data for the chart
  const chartData = Object.entries(counts)
    .filter(([_, value]) => value > 0) // Only include categories with issues
    .map(([key, value]) => ({
      name: CATEGORY_NAMES[key as keyof typeof CATEGORY_NAMES] || key,
      value,
      color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS] || '#e2e8f0'
    }))
    .sort((a, b) => b.value - a.value); // Sort by count descending
  
  return (
    <Card className="bg-white shadow-sm rounded-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Issue Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center">
          {chartData.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} (${((value / Object.values(counts).reduce((a, b) => a + b, 0)) * 100).toFixed(0)}%)`, 'Issues']}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingTop: 20 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-secondary-light">
              No issues to display
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IssueCategoryChart;
