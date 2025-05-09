
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckSquare, XSquare, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import StatusSelector from "./StatusSelector";
import CommentSection from "./CommentSection";

type IssueStatus = 'pending' | 'solved' | 'critical' | 'in-progress' | 'blocked';

interface IssueCardProps {
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
  index: number;
  onStatusChange?: (id: string, newStatus: IssueStatus) => void;
}

const statusClassMap: Record<IssueStatus, string> = {
  pending: 'bg-status-pending text-white',
  solved: 'bg-status-solved text-white',
  critical: 'bg-status-critical text-white',
  'in-progress': 'bg-blue-500 text-white',
  blocked: 'bg-orange-500 text-white',
};

const statusIconMap: Record<IssueStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  solved: <CheckSquare className="h-4 w-4" />,
  critical: <XSquare className="h-4 w-4" />,
  'in-progress': <Clock className="h-4 w-4" />,
  blocked: <XSquare className="h-4 w-4" />
};

const statusTextMap: Record<IssueStatus, string> = {
  pending: 'Pending',
  solved: 'Resolved',
  critical: 'Critical',
  'in-progress': 'In Progress',
  blocked: 'Blocked',
};

const IssueCard: React.FC<IssueCardProps> = ({
  id,
  title,
  description,
  reporter,
  dateReported,
  status,
  tags,
  index,
  onStatusChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  
  const initials = reporter.name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
  
  // Generate a seed from the reporter name for consistent avatar
  const avatarSeed = reporter.name.replace(/\s/g, '').toLowerCase();
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleTags = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTags(!showAllTags);
  };

  const handleStatusChange = (newStatus: IssueStatus) => {
    if (onStatusChange) {
      onStatusChange(id, newStatus);
    }
  };

  const displayTags = showAllTags ? tags : tags.slice(0, 3);
  
  return (
    <Card 
      className="bg-white shadow-sm rounded-lg overflow-hidden mb-4 animate-fade-in hover:shadow-md transition-all duration-300" 
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardHeader 
        className="pb-2 cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <StatusSelector 
            currentStatus={status}
            statusClassName={statusClassMap[status]}
            statusIcon={statusIconMap[status]}
            statusText={statusTextMap[status]}
            onStatusChange={handleStatusChange}
          />
        </div>
      </CardHeader>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardContent className="pb-0">
          <div className="space-y-4">
            <div className="text-sm leading-relaxed text-secondary whitespace-pre-line line-clamp-2">
              {description.substring(0, isExpanded ? undefined : 100)}
              {!isExpanded && description.length > 100 && '...'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {displayTags.map((tag, i) => (
                <Badge key={i} variant="outline" className="bg-primary-light/10 text-primary-dark border-primary-light/20">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && !showAllTags && (
                <Badge 
                  variant="outline" 
                  className="bg-gray-100 cursor-pointer hover:bg-gray-200"
                  onClick={toggleTags}
                >
                  +{tags.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex justify-center items-center py-1 border-t border-gray-100 mt-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                <span>Show more</span>
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            <div className="text-sm leading-relaxed text-secondary whitespace-pre-line">
              {description}
            </div>
          </CardContent>
          
          <CommentSection issueId={id} />
        </CollapsibleContent>
      </Collapsible>
      
      <CardFooter className="pt-2 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt={reporter.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-medium">{reporter.name}</p>
            {reporter.email && (
              <p className="text-xs text-secondary-light">{reporter.email}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <MessageSquare className="h-4 w-4 text-secondary-light" />
          <div className="text-xs text-secondary-light">
            {dateReported}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default IssueCard;
