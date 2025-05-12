import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import IssueCard from './IssueCard';
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewIssueDialog from './NewIssueDialog';
import { fetchIssues, fetchIssuesBySegment, fetchIssuesByStatus, updateIssueStatus } from '@/services/issueService';
import { Issue } from '@/types/issueTypes';
import { useProfile } from './ProfileContext';
import { toast } from 'sonner';

// Define the status types
type IssueStatus = 'waiting_for_help' | 'in_progress' | 'resolved' | 'blocked' | 'archived';

// Type guard to check if a string is a valid IssueStatus
function isIssueStatus(status: string): status is IssueStatus {
  return ['waiting_for_help', 'in_progress', 'resolved', 'blocked', 'archived'].includes(status);
}

interface IssueListProps {
  activeSegment: string | null;
  activeStatus?: IssueStatus | null;
  onFilterChange?: (issues: Issue[], showResolved: boolean, statusFilter: string) => void;
}

const IssueList: React.FC<IssueListProps> = ({ 
  activeSegment, 
  activeStatus = null, 
  onFilterChange 
}) => {
  const location = useLocation();
  const { activeProfile } = useProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewIssueOpen, setIsNewIssueOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get tag filter from URL for 10x coder category
  const urlParams = new URLSearchParams(location.search);
  const tagFilter = urlParams.get('tag');

  // Determine the effective status filter from the activeStatus prop
  const effectiveStatusFilter = activeStatus || 
    (statusFilter !== 'all' && isIssueStatus(statusFilter) ? statusFilter : null);
  
  // Query issues data - using the appropriate fetch method based on active filters
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues', activeSegment, effectiveStatusFilter],
    queryFn: async () => {
      console.log(`Fetching issues with activeSegment: "${activeSegment}", effectiveStatusFilter: "${effectiveStatusFilter}"`);
      
      // If filtering by status, use the status-specific fetch method
      if (effectiveStatusFilter) {
        console.log(`Using status filter method with status: ${effectiveStatusFilter}`);
        const statusIssues = await fetchIssuesByStatus(effectiveStatusFilter);
        
        // If also filtering by segment, apply that filter in memory
        if (activeSegment) {
          const filteredBySegment = statusIssues.filter(issue => issue.segment === activeSegment);
          console.log(`Filtered by segment ${activeSegment}: ${filteredBySegment.length} issues`);
          return filteredBySegment;
        }
        
        console.log(`Fetched ${statusIssues.length} issues with status ${effectiveStatusFilter}`);
        return statusIssues;
      }
      
      // Otherwise fetch by segment or all issues
      const result = activeSegment ? 
        await fetchIssuesBySegment(activeSegment) : 
        await fetchIssues();
      
      console.log(`Standard fetch: retrieved ${result.length} issues${activeSegment ? ` for segment "${activeSegment}"` : ' (all segments)'}`);
      
      return result;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 10000 // 10 seconds
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus, profileName }: { id: string; newStatus: IssueStatus; profileName: string }) => 
      updateIssueStatus(id, newStatus, profileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['status-counts'] });
    },
  });

  // Enhanced filter function with fuzzy matching and index search
  const filterIssues = () => {
    let result = [...issues];
    
    if (searchTerm) {
      // Check if searching by index format (#123)
      const indexMatch = searchTerm.match(/^#(\d+)$/);
      
      if (indexMatch) {
        // Get the numeric value after # and search by seq_id
        const searchIndex = parseInt(indexMatch[1], 10);
        result = result.filter(issue => 
          issue.seq_id === searchIndex
        );
      } else {
        // Fuzzy search in title, description, and tags
        const lowerSearchTerm = searchTerm.toLowerCase();
        result = result.filter(issue => 
          // Search in title
          issue.title.toLowerCase().includes(lowerSearchTerm) || 
          // Search in description
          issue.description.toLowerCase().includes(lowerSearchTerm) ||
          // Search in tags
          issue.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)) ||
          // Search in ID (partial matching)
          issue.id.toLowerCase().includes(lowerSearchTerm) ||
          // Search by seq_id (as string matching)
          (issue.seq_id && issue.seq_id.toString().includes(lowerSearchTerm))
        );
      }
    }
    
    console.log(`Filter results: ${result.length} issues after filtering`);
    return result;
  };

  // Update the handleStatusChange function
  const handleStatusChange = (id: string, newStatus: IssueStatus) => {
    // Pass the active profile name to the mutation
    statusMutation.mutate({ 
      id, 
      newStatus, 
      profileName: activeProfile?.name || 'System' 
    });
  };

  const handleAddNewIssue = (newIssue: any) => {
    setIsNewIssueOpen(false);
    // The actual mutation is handled in NewIssueDialog component
  };

  const filteredIssues = filterIssues();

  // Notify parent component about filter changes
  useEffect(() => {
    // First filter the issues based on current filters
    const currentFilteredIssues = filterIssues();

    // Dispatch custom event for Issues component to listen to
    const event = new CustomEvent('issueFiltersChanged', {
      detail: { issues: currentFilteredIssues, showResolved: false, statusFilter }
    });
    window.dispatchEvent(event);
    
    // Call callback if provided
    if (onFilterChange) {
      onFilterChange(currentFilteredIssues, false, statusFilter);
    }
  }, [issues, statusFilter, onFilterChange, activeSegment]);

  // Update the status filter handler to handle types safely
  const handleStatusFilterChange = (status: string) => {
    console.log(`Status filter changed to: ${status}`);
    
    // When changing status filter, invalidate the queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['issues'] });
    
    setStatusFilter(status);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading issues...</p>
        </div>
      ) : (
        <div className="issue-list-container">
          <div className="flex flex-col sm:flex-row gap-4 items-end mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-light" />
              <Input
                placeholder="Search issues by text or #index..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => setIsNewIssueOpen(true)}
              className="ml-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> New Issue
            </Button>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary-light">No issues found matching your criteria</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 gap-6">
                {filteredIssues.map((issue, index) => (
                  <IssueCard
                    key={issue.id}
                    id={issue.id}
                    seq_id={issue.seq_id}
                    title={issue.title || 'Untitled Issue'}
                    description={issue.description || ''}
                    reporter={{
                      name: issue.submitted_by || 'Unknown',
                      email: undefined
                    }}
                    dateReported={new Date(issue.created_at).toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                    status={issue.status as any}
                    tags={issue.tags || []}
                    index={index}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}
          
          <NewIssueDialog 
            open={isNewIssueOpen} 
            onOpenChange={setIsNewIssueOpen}
            onSubmit={handleAddNewIssue}
            defaultCategory={activeSegment || ''}
          />
        </div>
      )}
    </div>
  );
};

export default IssueList;
