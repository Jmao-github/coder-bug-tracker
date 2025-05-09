
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import IssueList from "@/components/IssueList";
import SegmentNavigation from "@/components/SegmentNavigation";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import IssueCategoryChart from "@/components/IssueCategoryChart";
import IssueStats from "@/components/IssueStats";

const Issues: React.FC = () => {
  const { segment } = useParams<{ segment: string }>();
  const [activeSegment, setActiveSegment] = useState<string | null>(segment || null);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <ScrollIndicator />
      
      <h1 className="text-3xl font-bold mb-6">
        {activeSegment ? `${activeSegment.charAt(0).toUpperCase() + activeSegment.slice(1)} Issues` : 'All Issues'}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SegmentNavigation 
            active={activeSegment} 
            onChange={setActiveSegment} 
          />
          
          <IssueList activeSegment={activeSegment} />
        </div>
        
        <div className="space-y-6">
          <IssueStats />
          <IssueCategoryChart />
        </div>
      </div>
    </div>
  );
};

export default Issues;
