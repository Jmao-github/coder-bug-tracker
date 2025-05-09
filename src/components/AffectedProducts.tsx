
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductData {
  name: string;
  issues: number;
  percentage: number;
}

const products: ProductData[] = [
  { name: '10xcoder', issues: 3, percentage: 37.5 },
  { name: 'cursor.dev', issues: 1, percentage: 12.5 },
  { name: '10xdev', issues: 1, percentage: 12.5 },
  { name: 'Other', issues: 3, percentage: 37.5 },
];

const AffectedProducts = () => {
  return (
    <Card className="bg-white shadow-sm rounded-lg overflow-hidden h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Affected Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{product.name}</span>
                <span>{product.issues} issues</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${product.percentage}%` }}
                  />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AffectedProducts;
