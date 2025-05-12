import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckSquare, XSquare, ChevronDown, ChevronUp, MessageSquare, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import StatusSelector from "./StatusSelector";
import CommentSection from "./CommentSection";
import IssueActionsMenu from './IssueActionsMenu';
import EditIssueDialog from './EditIssueDialog';
import { deleteIssue } from '@/services/issueService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  // Add a safety check for null or undefined description
  const safeDescription = description || '';
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(safeDescription.length > DESCRIPTION_THRESHOLD);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();
  
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
  
  const deleteMutation = useMutation({
    mutationFn: () => deleteIssue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue-counts'] });
      queryClient.invalidateQueries({ queryKey: ['status-counts'] });
      setDeleteOpen(false);
    },
    onError: () => {
      setDeleteOpen(false);
    }
  });

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStatusChange = (newStatus: IssueStatus) => {
    if (onStatusChange) {
      onStatusChange(id, newStatus);
    }
  };

  const handleViewMoreComments = () => {
    setIsExpanded(true);
  };

  // Get truncated and full versions of the description - use safeDescription instead
  const truncatedDescription = shouldTruncate 
    ? safeDescription.substring(0, DESCRIPTION_THRESHOLD) + '...' 
    : safeDescription;
  
  return (
    <div className="issue-card-container">
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
            <div className="flex items-center gap-2">
              <StatusSelector 
                currentStatus={status}
                statusClassName={statusClassMap[status] || 'bg-gray-500 text-white'}
                statusIcon={statusIconMap[status] || <Clock className="h-4 w-4" />}
                statusText={statusTextMap[status] || 'Unknown'}
                onStatusChange={handleStatusChange}
              />
              <IssueActionsMenu 
                onEdit={() => setEditOpen(true)}
                onDelete={() => setDeleteOpen(true)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-0">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="space-y-4">
            <div className="space-y-4">
              <div className="text-sm leading-relaxed text-secondary whitespace-pre-line">
                {isExpanded ? safeDescription : truncatedDescription}
              </div>
            </div>
            
            <CollapsibleContent className="animate-accordion-down border-t border-gray-100 pt-4">
              {/* Show full comment section when expanded */}
              <CommentSection issueId={id} />
            </CollapsibleContent>
          </Collapsible>
          
          {/* Always show comment preview outside collapsible when not expanded */}
          {!isExpanded && (
            <div className="mt-3">
              <CommentSection 
                issueId={id} 
                preview={true} 
                onViewMoreClick={handleViewMoreComments} 
              />
            </div>
          )}
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
                <div className="flex items-center">
                  <ChevronUp className="h-4 w-4 mr-1" />
                  <span>Show less</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  <span>Show more</span>
                </div>
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
      <EditIssueDialog 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        issue={{
          id,
          title,
          description,
          status,
          tags,
          segment: 'misc',
          submitted_by: reporter.name,
          assigned_to: null,
          created_at: '',
          updated_at: '',
          ready_for_delivery: null,
        }} 
        onSubmit={() => {}} 
      />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Issue</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this issue? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteMutation.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IssueCard;
