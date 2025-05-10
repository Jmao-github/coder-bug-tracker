import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, ChevronDown } from "lucide-react";
import { fetchComments, addComment } from '@/services/issueService';
import { NewComment } from '@/types/issueTypes';
import { toast } from 'sonner';
import { useProfile } from './ProfileContext';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  issueId: string;
  preview?: boolean;
  onViewMoreClick?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  issueId, 
  preview = false,
  onViewMoreClick 
}) => {
  const { activeProfile } = useProfile();
  const [newComment, setNewComment] = useState('');
  const [expandFirstComment, setExpandFirstComment] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch comments for this issue
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', issueId],
    queryFn: () => fetchComments(issueId),
  });
  
  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: (comment: NewComment) => addComment(comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
      setNewComment('');
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !activeProfile) {
      toast.error(activeProfile ? 'Please enter a comment' : 'Profile information is missing');
      return;
    }
    
    const comment: NewComment = {
      issue_id: issueId,
      author_name: activeProfile.name,
      body: newComment
    };
    
    commentMutation.mutate(comment);
  };

  // Get first sentence of a comment for preview mode
  const getFirstSentence = (text: string) => {
    const match = text.match(/^(.*?[.!?])\s/);
    if (match) return match[1];
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  // First comment for preview
  const firstComment = comments.length > 0 ? comments[0] : null;

  // Check if the first comment is long
  const isFirstCommentLong = firstComment && firstComment.body.length > 150;

  // Get the comment body to display
  const firstCommentBody = useMemo(() => {
    if (!firstComment) return '';
    if (preview && !expandFirstComment) {
      return getFirstSentence(firstComment.body);
    }
    return firstComment.body;
  }, [firstComment, preview, expandFirstComment]);

  // Don't return null anymore, as we always want to show the comment input
  // instead we conditionally render just the comments section

  return (
    <div className={cn("border-t border-gray-100 pt-3", preview ? "px-1 pb-1" : "px-6 pb-4")}>
      {(comments.length > 0 || !preview) && (
        <h4 className="text-sm font-medium flex items-center mb-2">
          <MessageSquare className="h-4 w-4 mr-2" />
          Comments ({comments.length})
        </h4>
      )}
      
      {isLoading ? (
        <div className="text-center py-2">Loading comments...</div>
      ) : (
        <div className="space-y-3 mb-3">
          {preview && comments.length > 0 ? (
            // Preview mode: Show only first comment with preview
            firstComment && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${firstComment.author_name.replace(/\s/g, '').toLowerCase()}`}
                    alt={firstComment.author_name} 
                  />
                  <AvatarFallback>
                    {firstComment.author_name
                      .split(' ')
                      .map(part => part.charAt(0))
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium">{firstComment.author_name}</p>
                    <span className="text-xs text-secondary-light">
                      {new Date(firstComment.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{firstCommentBody}</p>
                  
                  <div className="flex gap-2 mt-1">
                    {isFirstCommentLong && !expandFirstComment && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 text-xs" 
                        onClick={() => setExpandFirstComment(true)}
                      >
                        View More
                      </Button>
                    )}
                    
                    {comments.length > 1 && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 text-xs flex items-center" 
                        onClick={onViewMoreClick}
                      >
                        +{comments.length - 1} more comment{comments.length > 2 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : !preview && (
            // Full view: Show all comments
            comments.map(comment => {
              const avatarSeed = comment.author_name.replace(/\s/g, '').toLowerCase();
              const initials = comment.author_name
                .split(' ')
                .map(part => part.charAt(0))
                .join('')
                .toUpperCase();
                
              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                      alt={comment.author_name} 
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium">{comment.author_name}</p>
                      <span className="text-xs text-secondary-light">
                        {new Date(comment.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.body}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      
      {/* Always show the form regardless of preview mode */}
      <form onSubmit={handleSubmitComment} className={cn("mt-4 flex gap-2 items-end", preview ? "px-2" : "")}>
        <Textarea
          placeholder={`Add a comment as ${activeProfile?.name || 'User'}...`}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 resize-none"
          rows={2}
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={!newComment.trim() || !activeProfile || commentMutation.isPending}
        >
          {commentMutation.isPending ? 'Posting...' : 'Post'}
        </Button>
      </form>
    </div>
  );
};

export default CommentSection;
