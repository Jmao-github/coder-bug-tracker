
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUp } from "lucide-react";
import Chart from 'chart.js/auto';

const IssueStats = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart
      if (chart.current) {
        chart.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chart.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27', 'Apr 28'],
            datasets: [{
              label: 'New Issues',
              data: [1, 0, 2, 1, 0, 0, 4],
              borderColor: '#9b87f5',
              backgroundColor: 'rgba(155, 135, 245, 0.1)',
              tension: 0.4,
              fill: true,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 5,
                ticks: {
                  stepSize: 1
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chart.current) {
        chart.current.destroy();
      }
    };
  }, []);

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
            <canvas ref={chartRef}></canvas>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueStats;
