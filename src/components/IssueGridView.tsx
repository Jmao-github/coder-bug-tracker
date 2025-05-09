
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckSquare, XSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import StatusSelector from "./StatusSelector";
import CommentSection from "./CommentSection";

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

interface IssueGridViewProps {
  issues: Issue[];
  onStatusChange?: (id: string, status: IssueStatus) => void;
}

const statusIconMap: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-status-pending" />,
  solved: <CheckSquare className="h-4 w-4 text-status-solved" />,
  critical: <XSquare className="h-4 w-4 text-status-critical" />,
  'in-progress': <Clock className="h-4 w-4 text-blue-500" />,
  blocked: <XSquare className="h-4 w-4 text-orange-500" />
};

const statusTextMap: Record<string, string> = {
  pending: 'Pending',
  solved: 'Resolved',
  critical: 'Critical',
  'in-progress': 'In Progress',
  blocked: 'Blocked'
};

const statusClassMap: Record<string, string> = {
  pending: 'bg-status-pending text-white',
  solved: 'bg-status-solved text-white',
  critical: 'bg-status-critical text-white',
  'in-progress': 'bg-blue-500 text-white',
  blocked: 'bg-orange-500 text-white'
};

const IssueGridView = ({ issues, onStatusChange }: IssueGridViewProps) => {
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIssueId(expandedIssueId === id ? null : id);
  };

  const toggleTags = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTags(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStatusChange = (id: string, newStatus: IssueStatus) => {
    if (onStatusChange) {
      onStatusChange(id, newStatus);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {issues.map((issue) => {
        // Generate avatar seed from the reporter name
        const avatarSeed = issue.reporter.name.replace(/\s/g, '').toLowerCase();
        const initials = issue.reporter.name
          .split(' ')
          .map(part => part.charAt(0))
          .join('')
          .toUpperCase();

        const isExpanded = expandedIssueId === issue.id;
        const showAllTags = expandedTags[issue.id];
        const displayTags = showAllTags ? issue.tags : issue.tags.slice(0, 3);

        return (
          <div 
            key={issue.id} 
            className="bg-white rounded-lg shadow-sm p-4 flex flex-col hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => toggleExpand(issue.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-sm">{issue.title}</h3>
              <StatusSelector 
                currentStatus={issue.status}
                statusClassName={statusClassMap[issue.status]}
                statusIcon={statusIconMap[issue.status]}
                statusText={statusTextMap[issue.status]}
                onStatusChange={(status) => handleStatusChange(issue.id, status)}
              />
            </div>
            
            <Collapsible open={isExpanded}>
              <div className="mb-2">
                <div className="text-sm text-secondary-light line-clamp-2">
                  {!isExpanded && issue.description.length > 100 ? 
                    `${issue.description.substring(0, 100)}...` : 
                    isExpanded ? null : issue.description}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {displayTags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="bg-primary-light/10 text-primary-dark border-primary-light/20 text-xs">
                    {tag}
                  </Badge>
                ))}
                {issue.tags.length > 3 && !showAllTags && (
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-xs cursor-pointer hover:bg-gray-200"
                    onClick={(e) => toggleTags(issue.id, e)}
                  >
                    +{issue.tags.length - 3} more
                  </Badge>
                )}
              </div>
              
              <CollapsibleContent>
                <div className="border-t border-gray-100 pt-3 mb-3">
                  <p className="text-sm whitespace-pre-line">{issue.description}</p>
                </div>
                
                <CommentSection issueId={issue.id} />
              </CollapsibleContent>
              
              {!isExpanded && (
                <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt={issue.reporter.name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{issue.reporter.name}</span>
                  </div>
                </div>
              )}
            </Collapsible>
            
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full mt-2 flex justify-center items-center"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    <span className="text-xs">Show less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    <span className="text-xs">Show more</span>
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        );
      })}
    </div>
  );
};

export default IssueGridView;
