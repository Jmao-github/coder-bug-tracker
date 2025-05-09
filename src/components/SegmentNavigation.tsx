
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tag, FileCode, HelpCircle } from "lucide-react";

interface SegmentNavigationProps {
  activeSegment: string | null;
  onSegmentChange: (segment: string) => void;
}

const segments = [
  {
    id: 'auth',
    name: 'Auth & Login',
    icon: Tag,
    count: 7,
    color: 'from-purple-500/20 to-indigo-400/20',
    borderColor: 'border-purple-400/40',
    tags: ['login-issue', 'email-', 'auth']
  },
  {
    id: 'code',
    name: 'Code Generation',
    icon: FileCode,
    count: 1,
    color: 'from-blue-500/20 to-cyan-400/20',
    borderColor: 'border-blue-400/40',
    tags: ['code-generation', 'session-']
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    icon: HelpCircle,
    count: 0,
    color: 'from-gray-400/20 to-gray-300/20',
    borderColor: 'border-gray-300/40',
    tags: []
  }
];

const SegmentNavigation = ({ activeSegment, onSegmentChange }: SegmentNavigationProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {segments.map((segment) => (
        <Card 
          key={segment.id}
          onClick={() => onSegmentChange(segment.id)}
          className={`cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md
            bg-gradient-to-br ${segment.color} border ${segment.borderColor}
            ${activeSegment === segment.id ? 'ring-2 ring-primary/50 shadow-lg' : ''}
          `}
        >
          <CardContent className="p-6 flex flex-col items-center text-center">
            <segment.icon className="h-10 w-10 mb-2 text-primary-dark/70" />
            <div className="text-4xl font-bold mb-1">{segment.count}</div>
            <div className="text-sm font-medium">{segment.name}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SegmentNavigation;
