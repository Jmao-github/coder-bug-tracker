import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import IssueList from "@/components/IssueList";
import SegmentNavigation from "@/components/SegmentNavigation";
import ScrollIndicator from "@/components/ScrollIndicator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchIssues, fetchIssueCountsBySegment } from '@/services/issueService';
import { Issue } from '@/types/issueTypes';
import { toast } from 'sonner';
import StatusTiles from '@/components/StatusTiles';

// Define the status types
type IssueStatus = 'waiting_for_help' | 'pending' | 'resolved' | 'blocked' | 'archived';

const Issues: React.FC = () => {
  const { segment } = useParams<{ segment: string }>();
  const navigate = useNavigate();
  const [activeSegment, setActiveSegment] = useState<string | null>(segment || null);
  const [activeStatus, setActiveStatus] = useState<IssueStatus | null>(null);
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({
    auth: 0,
    code: 0,
    tool: 0,
    misc: 0
  });
  const [statusCounts, setStatusCounts] = useState<Record<IssueStatus, number>>({
    pending: 0,
    waiting_for_help: 0,
    blocked: 0,
    resolved: 0,
    archived: 0
  });
  const [totalIssueCount, setTotalIssueCount] = useState<number>(0);

  // Fetch all issues for counting - with improved configuration
  const { data: allIssues = [], error: issuesError, isLoading: issuesLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      try {
        const data = await fetchIssues();
        console.log('Successfully fetched', data.length, 'issues for counting');
        // Update the total count immediately when data is fetched
        setTotalIssueCount(data.length);
        return data;
      } catch (error) {
        console.error('Error fetching issues:', error);
        toast.error('Failed to load issues. Matrix cards may show incorrect counts.');
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true,      // Refetch when component mounts
    refetchOnReconnect: true,  // Refetch when reconnecting
  });

  // Direct count query - Always fetch as a parallel source of truth
  const { data: directCounts, isSuccess: directCountSuccess } = useQuery({
    queryKey: ['issue-counts'],
    queryFn: async () => {
      try {
        const counts = await fetchIssueCountsBySegment();
        // Calculate total from direct counts as a reliable fallback
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        if (total > 0 && totalIssueCount === 0) {
          setTotalIssueCount(total);
        }
        return counts;
      } catch (error) {
        console.error('Error fetching direct counts:', error);
        return { auth: 0, code: 0, tool: 0, misc: 0 };
      }
    },
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Handle direct count success
  useEffect(() => {
    if (directCountSuccess && directCounts) {
      console.log('Direct count query successful, updating counts:', directCounts);
      setSegmentCounts(directCounts);
      
      // Update total count if it's still 0 but we have direct counts
      const directTotal = Object.values(directCounts).reduce((sum, count) => sum + count, 0);
      if (directTotal > 0 && totalIssueCount === 0) {
        console.log('Updating total count from direct counts:', directTotal);
        setTotalIssueCount(directTotal);
      }
    }
  }, [directCountSuccess, directCounts, totalIssueCount]);

  // Calculate status counts
  useEffect(() => {
    if (!allIssues || allIssues.length === 0) return;
    
    const counts: Record<IssueStatus, number> = {
      pending: 0,
      waiting_for_help: 0,
      blocked: 0,
      resolved: 0,
      archived: 0
    };
    
    try {
      allIssues.forEach(issue => {
        if (!issue) return;
        
        // Count by status
        const status = issue.status as IssueStatus;
        if (status in counts) {
          counts[status]++;
        }
      });
      
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error calculating status counts:', error);
    }
  }, [allIssues]);

  // Calculate GLOBAL segment counts (not filtered by active segment)
  const updateGlobalSegmentCounts = () => {
    if (!allIssues || allIssues.length === 0) {
      console.log('No issues data available');
      return;
    }
    
    console.log('Updating segment counts with', allIssues.length, 'issues');
    
    // Update total count if needed
    if (totalIssueCount !== allIssues.length) {
      setTotalIssueCount(allIssues.length);
    }
    
    const counts: Record<string, number> = {
      auth: 0,
      code: 0,
      tool: 0,
      misc: 0
    };

    // Create a safe forEach function in case allIssues is not iterable
    try {
      allIssues.forEach(issue => {
        if (!issue) return; // Skip undefined issues
        
        // Safety check for issue.segment
        if (!issue.segment) {
          console.warn('Issue missing segment:', issue.id);
          counts['misc']++;
          return;
        }
        
        // Count directly by segment - we now have a dedicated 'tool' segment
        const segment = issue.segment as string;
        if (segment in counts) {
          counts[segment]++;
        } else {
          counts['misc']++;
        }
      });
    } catch (error) {
      console.error('Error calculating segment counts:', error);
      toast.error('Error calculating issue counts');
    }

    console.log('Final segment counts:', counts);
    
    // Check if all counts are zero and we have issues
    if (Object.values(counts).every(count => count === 0) && allIssues.length > 0) {
      console.warn('All segment counts are zero despite having issues. Using fallback count method.');
      
      // Try a simpler counting method as fallback
      try {
        allIssues.forEach(issue => {
          if (!issue || !issue.segment) return;
          
          const segment = issue.segment.toString();
          if (segment === 'auth') counts.auth++;
          else if (segment === 'code') counts.code++;
          else counts.misc++;
        });
        
        console.log('Fallback segment counts:', counts);
      } catch (error) {
        console.error('Fallback counting also failed:', error);
      }
    }
    
    setSegmentCounts(counts);
  };

  // Initial counts calculation
  useEffect(() => {
    console.log('AllIssues dependency changed, current issues:', allIssues ? allIssues.length : 'none');
    if (allIssues && allIssues.length > 0) {
      updateGlobalSegmentCounts();
    }
  }, [allIssues]);

  // Handle segment selection
  const handleSegmentChange = (segment: string) => {
    setActiveSegment(segment);
    // Clear status filter when changing segment
    setActiveStatus(null);
    navigate(`/issues/${segment}`);
  };
  
  // Handle status selection
  const handleStatusChange = (status: IssueStatus | null) => {
    setActiveStatus(status);
    // When selecting a status, we want to show issues from all categories
    if (status) {
      setActiveSegment(null);
      navigate('/issues');
    }
  };

  // Update title based on active filters
  const getPageTitle = () => {
    if (activeStatus) {
      return `${activeStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Issues`;
    } else if (activeSegment) {
      return `${activeSegment.charAt(0).toUpperCase() + activeSegment.slice(1)} Issues`;
    } else {
      return 'All Issues';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <ScrollIndicator />
      
      <h1 className="text-3xl font-bold mb-6">
        {getPageTitle()}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SegmentNavigation 
            activeSegment={activeSegment} 
            onSegmentChange={handleSegmentChange}
            segmentCounts={segmentCounts}
          />
          
          <IssueList 
            activeSegment={activeSegment}
            activeStatus={activeStatus}
            onFilterChange={undefined}
          />
        </div>
        
        <div className="space-y-6">
          <Card className="bg-white shadow-sm rounded-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-center">{totalIssueCount}</div>
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <h2 className="text-lg font-medium px-1">Issues by Status</h2>
            <StatusTiles 
              statusCounts={statusCounts}
              activeStatus={activeStatus}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Issues;
