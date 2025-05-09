
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";

interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
}

interface CommentSectionProps {
  issueId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ issueId }) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: { name: 'Jason Zhou' },
      content: 'Thanks for reporting this! We\'ll look into it.',
      timestamp: 'May 1, 2025 - 10:23 AM'
    },
    {
      id: '2',
      author: { name: 'Dev Team' },
      content: 'This appears to be related to session caching. We\'re working on a fix.',
      timestamp: 'May 2, 2025 - 2:45 PM'
    }
  ]);
  
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: { name: 'Community Manager' },
      content: newComment,
      timestamp: new Date().toLocaleString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
    
    setComments([...comments, comment]);
    setNewComment('');
  };

  return (
    <div className="border-t border-gray-100 pt-4 px-6 pb-4">
      <h4 className="text-sm font-medium flex items-center mb-4">
        <MessageSquare className="h-4 w-4 mr-2" />
        Comments ({comments.length})
      </h4>
      
      <div className="space-y-4 mb-4">
        {comments.map(comment => {
          const avatarSeed = comment.author.name.replace(/\s/g, '').toLowerCase();
          const initials = comment.author.name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase();
            
          return (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={comment.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                  alt={comment.author.name} 
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-medium">{comment.author.name}</p>
                  <span className="text-xs text-secondary-light">{comment.timestamp}</span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <form onSubmit={handleSubmitComment} className="flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={!newComment.trim()}>
          Post
        </Button>
      </form>
    </div>
  );
};

export default CommentSection;
