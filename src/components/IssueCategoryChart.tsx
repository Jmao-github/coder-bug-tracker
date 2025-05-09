
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Chart from 'chart.js/auto';

const IssueCategoryChart = () => {
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
          type: 'doughnut',
          data: {
            labels: ['Login/Auth Issues', 'Code Generation', 'Other'],
            datasets: [{
              data: [7, 1, 0],
              backgroundColor: [
                '#9b87f5',  // Primary
                '#1EAEDB',  // Status-pending
                '#e2e8f0',  // Light gray
              ],
              borderColor: '#ffffff',
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'circle',
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
    <Card className="bg-white shadow-sm rounded-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Issue Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center">
          <canvas ref={chartRef}></canvas>
        </div>
      </CardContent>
    </Card>
  );
};

export default IssueCategoryChart;
