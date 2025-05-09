
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckSquare, XSquare } from "lucide-react";

type IssueStatus = 'pending' | 'solved' | 'critical';

interface IssueCardProps {
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
}

const statusClassMap: Record<IssueStatus, string> = {
  pending: 'bg-status-pending text-white',
  solved: 'bg-status-solved text-white',
  critical: 'bg-status-critical text-white',
};

const statusIconMap: Record<IssueStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  solved: <CheckSquare className="h-4 w-4" />,
  critical: <XSquare className="h-4 w-4" />
};

const statusTextMap: Record<IssueStatus, string> = {
  pending: 'Pending',
  solved: 'Solved',
  critical: 'Critical',
};

const IssueCard: React.FC<IssueCardProps> = ({
  title,
  description,
  reporter,
  dateReported,
  status,
  tags,
  index
}) => {
  const initials = reporter.name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
  
  // Generate a seed from the reporter name for consistent avatar
  const avatarSeed = reporter.name.replace(/\s/g, '').toLowerCase();
  
  return (
    <Card 
      className="bg-white shadow-sm rounded-lg overflow-hidden h-full animate-fade-in hover:shadow-md transition-all duration-300" 
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Badge className={`${statusClassMap[status]} flex items-center gap-1`}>
            {statusIconMap[status]}
            {statusTextMap[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm leading-relaxed text-secondary whitespace-pre-line">
            {description}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="bg-primary-light/10 text-primary-dark border-primary-light/20">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
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
        <div className="text-xs text-secondary-light">
          {dateReported}
        </div>
      </CardFooter>
    </Card>
  );
};

export default IssueCard;
