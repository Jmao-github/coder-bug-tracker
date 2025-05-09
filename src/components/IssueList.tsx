
import React, { useState, useEffect } from 'react';
import IssueCard from './IssueCard';
import IssueGridView from './IssueGridView';
import ViewToggle from './ViewToggle';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

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
  status: 'pending' | 'solved' | 'critical';
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
    status: 'pending',
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
    status: 'pending',
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
    status: 'pending',
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
  // First by status: pending → critical → solved
  const statusOrder = { pending: 0, critical: 1, solved: 2 };
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

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('issueViewMode');
    if (savedViewMode && (savedViewMode === 'card' || savedViewMode === 'grid')) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save preferences to localStorage
  const handleViewModeChange = (mode: 'card' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('issueViewMode', mode);
  };

  const filteredIssues = issuesData
    .filter(issue => {
      // Apply segment filter
      if (activeSegment && getIssueSegment(issue) !== activeSegment) {
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
              <SelectItem value="solved">Solved</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ViewToggle viewMode={viewMode} onChange={handleViewModeChange} />
      </div>

      {filteredIssues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-secondary-light">No issues found matching your criteria</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredIssues.map((issue, index) => (
                <IssueCard
                  key={issue.id}
                  title={issue.title}
                  description={issue.description}
                  reporter={issue.reporter}
                  dateReported={issue.dateReported}
                  status={issue.status}
                  tags={issue.tags}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <IssueGridView issues={filteredIssues} />
          )}
        </div>
      )}
    </div>
  );
};

export default IssueList;
