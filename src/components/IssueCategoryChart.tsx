
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Login/Auth Issues', value: 7, color: '#9b87f5' },
  { name: 'Code Generation', value: 1, color: '#1EAEDB' },
  { name: 'Other', value: 0, color: '#e2e8f0' },
];

const IssueCategoryChart = () => {
  return (
    <Card className="bg-white shadow-sm rounded-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Issue Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, 'Issues']} />
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
        </div>
      </CardContent>
    </Card>
  );
};

export default IssueCategoryChart;
