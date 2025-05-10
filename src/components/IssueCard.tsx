import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckSquare, XSquare, ChevronDown, ChevronUp, MessageSquare, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import StatusSelector from "./StatusSelector";
import CommentSection from "./CommentSection";

type IssueStatus = 'waiting_for_help' | 'in_progress' | 'resolved' | 'blocked' | 'archived';

interface IssueCardProps {
  id: string;
  seq_id?: number;
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

const statusClassMap: Record<string, string> = {
  in_progress: 'bg-yellow-500 text-white',
  resolved: 'bg-green-500 text-white',
  waiting_for_help: 'bg-blue-500 text-white',
  blocked: 'bg-red-500 text-white',
  archived: 'bg-gray-500 text-white'
};

const statusIconMap: Record<string, React.ReactNode> = {
  in_progress: <Clock className="h-4 w-4" />,
  resolved: <CheckSquare className="h-4 w-4" />,
  waiting_for_help: <Clock className="h-4 w-4" />,
  blocked: <XSquare className="h-4 w-4" />,
  archived: <CheckSquare className="h-4 w-4" />
};

const statusTextMap: Record<string, string> = {
  in_progress: 'In Progress',
  resolved: 'Resolved',
  waiting_for_help: 'Waiting for Help',
  blocked: 'Blocked',
  archived: 'Archived'
};

// Character limit for truncated description 
const DESCRIPTION_THRESHOLD = 150;

const IssueCard: React.FC<IssueCardProps> = ({
  id,
  seq_id,
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
  const [shouldTruncate, setShouldTruncate] = useState(description.length > DESCRIPTION_THRESHOLD);
  
  const initials = reporter.name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
  
  // Generate a seed from the reporter name for consistent avatar
  const avatarSeed = reporter.name.replace(/\s/g, '').toLowerCase();
  
  // Format UUID for display (first 8 characters)
  const shortId = id.split('-')[0];
  
  // Format the sequential ID
  const formattedSeqId = seq_id ? `#${seq_id.toString().padStart(3, '0')}` : '';
  
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

  // Get truncated and full versions of the description
  const truncatedDescription = shouldTruncate 
    ? description.substring(0, DESCRIPTION_THRESHOLD) + '...' 
    : description;
  
  return (
    <Card 
      className="bg-white shadow-sm rounded-lg overflow-hidden mb-4 animate-fade-in hover:shadow-md transition-all duration-300" 
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {seq_id && (
              <div className="text-xl font-bold text-primary mr-1">
                {formattedSeqId}
              </div>
            )}
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {shortId}
            </Badge>
          </div>
          <StatusSelector 
            currentStatus={status}
            statusClassName={statusClassMap[status] || 'bg-gray-500 text-white'}
            statusIcon={statusIconMap[status] || <Clock className="h-4 w-4" />}
            statusText={statusTextMap[status] || 'Unknown'}
            onStatusChange={handleStatusChange}
          />
        </div>
      </CardHeader>

      <CardContent className="pb-0">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="space-y-4">
          <div className="space-y-4">
            <div className="text-sm leading-relaxed text-secondary whitespace-pre-line">
              {isExpanded ? description : truncatedDescription}
            </div>
            
            {/* Tags section */}
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
          
          {/* Show more content when expanded */}
          <CollapsibleContent className="animate-accordion-down border-t border-gray-100 pt-4">
            <CommentSection issueId={id} />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      {/* Show More/Less button - only show if description is long enough to need truncation */}
      {shouldTruncate && (
        <div className="px-6 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex justify-center items-center py-1"
            onClick={toggleExpand}
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
        </div>
      )}
      
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
