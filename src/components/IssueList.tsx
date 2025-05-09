
import React, { useState, useEffect } from 'react';
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

type IssueStatus = 'pending' | 'solved' | 'critical' | 'in-progress' | 'blocked';

interface Issue {
  id: string;
  title: string;
  description: string;
  reporter: {
    name: string;
    email?: string;
    avatar?: string;
  };
  dateReported: string;
  status: IssueStatus;
  tags: string[];
}

interface IssueListProps {
  activeSegment: string | null;
}

const issuesData: Issue[] = [
  {
    id: '1',
    title: 'Issue Report - 10xcoder Tool',
    description: 'I create first app for Notes and it works fine, i create a second app for something else (for example soccer app), and when I download the code, it still have the Note files. so it\'s not really generate the soccer app 🤨?',
    reporter: {
      name: 'Chen Reuven',
      avatar: 'chen'
    },
    dateReported: 'April 28, 2025 – 12:09 AM',
    status: 'pending',
    tags: ['#bug', '#code-generation', '#session-cache', '#10xcoder']
  },
  {
    id: '2',
    title: 'Email Access Conflict (Julian Malicki)',
    description: 'I can\'t access 10xcoder because I used my apple iCloud mail instead of google one, is there any chance for me to use it?',
    reporter: {
      name: 'Julian Malicki',
      email: 'malicki.julian@icloud.com',
      avatar: 'julian'
    },
    dateReported: 'N/A',
    status: 'pending',
    tags: ['#login-issue', '#email-conflict', '#icloud', '#10xcoder']
  },
  {
    id: '3',
    title: 'Email Access Conflict (Bob Milani)',
    description: '10xdev website needs Google to login and I signed up here using my other email.',
    reporter: {
      name: 'Bob Milani',
      email: 'bobmilani@me.com',
      avatar: 'bob'
    },
    dateReported: 'N/A',
    status: 'in-progress',
    tags: ['#login-issue', '#email-mismatch', '#10xdev', '#me.com']
  },
  {
    id: '4',
    title: 'Email Update Request (Roma / Rustam Rahimov)',
    description: 'Hey I am trying to login to cursor.dev it asking only gmail but my account here is icloud. Can you help me change my email address to rustamrahimlijapan@gmail.com so I can login to premium access futures?',
    reporter: {
      name: 'Roma (Rustam Rahimov)',
      email: 'rahimovrr@icloud.com',
      avatar: 'roma'
    },
    dateReported: 'N/A',
    status: 'blocked',
    tags: ['#login-issue', '#cursor', '#email-update', '#icloud', '#gmail']
  },
  {
    id: '5',
    title: 'Outlook Email Login Block (Ming)',
    description: 'Hi, Jason. I just joined the community, and I\'m happy to be here. I\'d like to use 10xcoder.dev, but my registered email is outlook\'s, as it requires gmail\'s. How can I access it with my registered email?',
    reporter: {
      name: 'Ming',
      email: 'gurumao2014@outlook.com',
      avatar: 'ming'
    },
    dateReported: 'N/A',
    status: 'solved',
    tags: ['#login-issue', '#email-block', '#outlook', '#10xcoder']
  }
];

// Helper function to determine which segment an issue belongs to
const getIssueSegment = (issue: Issue): string => {
  const tags = issue.tags.map(tag => tag.toLowerCase().replace('#', ''));
  
  // Check for Auth & Login segment
  if (tags.some(tag => 
    tag.includes('login-issue') || 
    tag.includes('email') || 
    tag.includes('auth')
  )) {
    return 'auth';
  }
  
  // Check for Code Generation segment
  if (tags.some(tag => 
    tag.includes('code-generation') || 
    tag.includes('session')
  )) {
    return 'code';
  }
  
  // Default to Miscellaneous
  return 'misc';
};

// Sort function for issues
const sortIssues = (a: Issue, b: Issue): number => {
  // First by status priority
  const statusOrder: Record<IssueStatus, number> = { 
    'pending': 0, 
    'in-progress': 1, 
    'blocked': 2, 
    'critical': 3, 
    'solved': 4 
  };
  if (statusOrder[a.status] !== statusOrder[b.status]) {
    return statusOrder[a.status] - statusOrder[b.status];
  }
  
  // Then by date (newest first) - simplified comparison
  if (a.dateReported === 'N/A' && b.dateReported !== 'N/A') return 1;
  if (a.dateReported !== 'N/A' && b.dateReported === 'N/A') return -1;
  if (a.dateReported > b.dateReported) return -1;
  if (a.dateReported < b.dateReported) return 1;
  
  return 0;
};

const IssueList: React.FC<IssueListProps> = ({ activeSegment }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');
  const [issues, setIssues] = useState<Issue[]>(issuesData);
  const [showResolved, setShowResolved] = useState(false);
  const [isNewIssueOpen, setIsNewIssueOpen] = useState(false);

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

  // Save preferences to localStorage
  const handleViewModeChange = (mode: 'card' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('issueViewMode', mode);
  };

  const handleShowResolvedChange = (value: boolean) => {
    setShowResolved(value);
    localStorage.setItem('showResolved', value.toString());
  };

  const handleStatusChange = (id: string, newStatus: IssueStatus) => {
    setIssues(currentIssues => 
      currentIssues.map(issue => 
        issue.id === id ? { ...issue, status: newStatus } : issue
      )
    );
  };

  const handleAddNewIssue = (newIssue: Omit<Issue, 'id' | 'dateReported' | 'status'>) => {
    const issueToAdd: Issue = {
      ...newIssue,
      id: Date.now().toString(),
      dateReported: new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      status: 'pending'
    };
    
    setIssues(current => [...current, issueToAdd]);
    setIsNewIssueOpen(false);
  };

  const filteredIssues = issues
    .filter(issue => {
      // Apply segment filter
      if (activeSegment && getIssueSegment(issue) !== activeSegment) {
        return false;
      }
      
      // Filter by resolved status
      if (!showResolved && issue.status === 'solved') {
        return false;
      }
      
      // Apply search filter
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.reporter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Apply status filter
      const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    // Sort the issues
    .sort(sortIssues);

  return (
    <div className="space-y-6">
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
                  reporter={issue.reporter}
                  dateReported={issue.dateReported}
                  status={issue.status}
                  tags={issue.tags}
                  index={index}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <IssueGridView 
              issues={filteredIssues} 
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
    </div>
  );
};

export default IssueList;
