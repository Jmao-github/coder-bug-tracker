
import React, { useState } from 'react';
import IssueCard from './IssueCard';
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

const IssueList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredIssues = issuesData.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.reporter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
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
      </div>

      {filteredIssues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-secondary-light">No issues found matching your criteria</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default IssueList;
