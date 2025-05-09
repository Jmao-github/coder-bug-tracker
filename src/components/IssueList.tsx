
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import IssueCard from './IssueCard';
import IssueGridView from './IssueGridView';
import ViewToggle from './ViewToggle';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import NewIssueDialog from './NewIssueDialog';
import { fetchIssues, fetchIssuesBySegment, updateIssueStatus } from '@/services/issueService';
import { Issue } from '@/types/issueTypes';

interface IssueListProps {
  activeSegment: string | null;
}

const IssueList: React.FC<IssueListProps> = ({ activeSegment }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');
  const [showResolved, setShowResolved] = useState(false);
  const [isNewIssueOpen, setIsNewIssueOpen] = useState(false);
  const queryClient = useQueryClient();

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('issueViewMode');
    if (savedViewMode && (savedViewMode === 'card' || savedViewMode === 'grid')) {
      setViewMode(savedViewMode);
    }
    
    const savedShowResolved = localStorage.getItem('showResolved');
    if (savedShowResolved) {
      setShowResolved(savedShowResolved === 'true');
    }
  }, []);

  // Query issues data
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues', activeSegment],
    queryFn: () => activeSegment ? fetchIssuesBySegment(activeSegment) : fetchIssues(),
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) => 
      updateIssueStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });

  // Save preferences to localStorage
  const handleViewModeChange = (mode: 'card' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('issueViewMode', mode);
  };

  const handleShowResolvedChange = (value: boolean) => {
    setShowResolved(value);
    localStorage.setItem('showResolved', value.toString());
  };

  const handleStatusChange = (id: string, newStatus: 'pending' | 'solved' | 'critical' | 'in-progress' | 'blocked') => {
    // Map UI status to database status if needed
    const dbStatus = newStatus === 'solved' ? 'solved' : newStatus;
    statusMutation.mutate({ id, newStatus: dbStatus });
  };

  const handleAddNewIssue = (newIssue: any) => {
    setIsNewIssueOpen(false);
    // The actual mutation is handled in NewIssueDialog component
  };

  const filteredIssues = issues
    .filter(issue => {
      // Filter by resolved status
      if (!showResolved && issue.status === 'solved') {
        return false;
      }
      
      // Apply search filter
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Apply status filter
      const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading issues...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-light" />
              <Input
                placeholder="Search issues..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="solved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ViewToggle viewMode={viewMode} onChange={handleViewModeChange} />
            <Button 
              onClick={() => setIsNewIssueOpen(true)}
              className="ml-auto sm:ml-0"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> New Issue
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="showResolved" 
              checked={showResolved} 
              onCheckedChange={handleShowResolvedChange}
            />
            <Label htmlFor="showResolved">Show Resolved Issues</Label>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary-light">No issues found matching your criteria</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 gap-6">
                  {filteredIssues.map((issue, index) => (
                    <IssueCard
                      key={issue.id}
                      id={issue.id}
                      title={issue.title}
                      description={issue.description}
                      reporter={{
                        name: issue.submitted_by,
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
                      tags={issue.tags}
                      index={index}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <IssueGridView 
                  issues={filteredIssues.map(issue => ({
                    id: issue.id,
                    title: issue.title,
                    description: issue.description,
                    reporter: {
                      name: issue.submitted_by,
                      email: undefined
                    },
                    dateReported: new Date(issue.created_at).toLocaleString(),
                    status: issue.status as any,
                    tags: issue.tags
                  }))} 
                  onStatusChange={handleStatusChange}
                />
              )}
            </div>
          )}
          
          <NewIssueDialog 
            open={isNewIssueOpen} 
            onOpenChange={setIsNewIssueOpen}
            onSubmit={handleAddNewIssue}
          />
        </>
      )}
    </div>
  );
};

export default IssueList;
