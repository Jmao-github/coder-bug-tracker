import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { fetchComments, addComment } from '@/services/issueService';
import { NewComment } from '@/types/issueTypes';
import { toast } from 'sonner';
import { useProfile } from './ProfileContext';

interface CommentSectionProps {
  issueId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ issueId }) => {
  const { activeProfile } = useProfile();
  const [newComment, setNewComment] = useState('');
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

  return (
    <div className="border-t border-gray-100 pt-4 px-6 pb-4">
      <h4 className="text-sm font-medium flex items-center mb-4">
        <MessageSquare className="h-4 w-4 mr-2" />
        Comments ({comments.length})
      </h4>
      
      {isLoading ? (
        <div className="text-center py-2">Loading comments...</div>
      ) : (
        <div className="space-y-4 mb-4">
          {comments.map(comment => {
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
          })}
        </div>
      )}
      
      <form onSubmit={handleSubmitComment} className="mt-4 flex gap-2 items-end">
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
