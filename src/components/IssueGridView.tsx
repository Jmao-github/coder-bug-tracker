
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckSquare, XSquare } from "lucide-react";

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

interface IssueGridViewProps {
  issues: Issue[];
}

const statusIconMap: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-status-pending" />,
  solved: <CheckSquare className="h-4 w-4 text-status-solved" />,
  critical: <XSquare className="h-4 w-4 text-status-critical" />
};

const statusTextMap: Record<string, string> = {
  pending: 'Pending',
  solved: 'Solved',
  critical: 'Critical'
};

const IssueGridView = ({ issues }: IssueGridViewProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {issues.map((issue) => {
        // Generate avatar seed from the reporter name
        const avatarSeed = issue.reporter.name.replace(/\s/g, '').toLowerCase();
        const initials = issue.reporter.name
          .split(' ')
          .map(part => part.charAt(0))
          .join('')
          .toUpperCase();

        return (
          <div 
            key={issue.id} 
            className="bg-white rounded-lg shadow-sm p-4 flex flex-col hover:shadow-md transition-all duration-300 h-full"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium text-sm line-clamp-2">{issue.title}</h3>
              <div className="flex items-center gap-1 text-xs">
                {statusIconMap[issue.status]}
                <span>{statusTextMap[issue.status]}</span>
              </div>
            </div>
            
            <div className="flex-grow">
              <div className="flex flex-wrap gap-1 mb-3">
                {issue.tags.slice(0, 3).map((tag, i) => (
                  <Badge key={i} variant="outline" className="bg-primary-light/10 text-primary-dark border-primary-light/20 text-xs">
                    {tag}
                  </Badge>
                ))}
                {issue.tags.length > 3 && (
                  <span className="text-xs text-secondary-light">+{issue.tags.length - 3} more</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt={issue.reporter.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs">{issue.reporter.name}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IssueGridView;
