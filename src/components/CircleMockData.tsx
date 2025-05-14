import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

// Sample Circle.so mock data
const SAMPLE_MOCK_DATA = [
  {
    id: "msg_" + Date.now(),
    message: {
      content: {
        message_id: "msg_" + Date.now(),
        issue_title: "Login process fails when email contains special characters",
        is_issue: true
      }
    },
    body: "I'm consistently having trouble logging in when I use my work email that contains a plus sign (john+work@example.com). The system seems to reject it or lose the part after the plus. This happens on both mobile and desktop browsers.",
    parent_body: null,
    sender: {
      name: "John Developer",
      email: "john@example.com"
    },
    parent_sender: null,
    chat_thread_id: null,
    space_name: "Technical Support",
    space_id: "space_12345",
    link: "https://circle.so/c/technical-support/thread-12345"
  },
  {
    id: "msg_" + (Date.now() + 1),
    message: {
      content: {
        message_id: "msg_" + (Date.now() + 1),
        issue_title: "Thread discussion about component rendering issue",
        is_issue: true
      }
    },
    body: "Has anyone else noticed the React components rendering twice in development mode?",
    parent_body: "We're seeing some strange behavior with our React components rendering twice in development mode. This seems to be causing performance issues and some weird state management bugs.",
    sender: {
      name: "React Developer",
      email: "dev@example.com"
    },
    parent_sender: "Sarah Tech Lead",
    chat_thread_id: "thread_98765",
    space_name: "Frontend Discussions",
    space_id: "space_67890",
    link: "https://circle.so/c/frontend-discussions/thread-98765"
  }
];

const CircleMockData: React.FC = () => {
  const [mockData, setMockData] = useState<string>(JSON.stringify(SAMPLE_MOCK_DATA, null, 2));
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(mockData).then(
      () => {
        toast.success('Mock data copied to clipboard');
      },
      () => {
        toast.error('Failed to copy to clipboard');
      }
    );
  };
  
  const handleReset = () => {
    setMockData(JSON.stringify(SAMPLE_MOCK_DATA, null, 2));
    toast.info('Reset to sample data');
  };
  
  const generateNewIds = () => {
    try {
      const data = JSON.parse(mockData);
      const updatedData = data.map((item: any) => {
        const newId = "msg_" + Date.now() + Math.floor(Math.random() * 1000);
        return {
          ...item,
          id: newId,
          message: {
            ...item.message,
            content: {
              ...item.message.content,
              message_id: newId
            }
          }
        };
      });
      
      setMockData(JSON.stringify(updatedData, null, 2));
      toast.success('Generated new IDs for mock data');
    } catch (error) {
      toast.error('Failed to parse JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Circle.so Mock Data</CardTitle>
        <CardDescription>
          Sample data for testing the Circle.so webhook integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Edit this data to simulate different Circle.so messages for testing</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mockData">Mock JSON Data</Label>
          <ScrollArea className="h-80 w-full rounded-md border">
            <Textarea
              id="mockData"
              value={mockData}
              onChange={(e) => setMockData(e.target.value)}
              className="font-mono text-xs min-h-[20rem] resize-none border-none focus-visible:ring-0"
            />
          </ScrollArea>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Sample
          </Button>
          <Button variant="outline" onClick={generateNewIds}>
            Generate New IDs
          </Button>
          <Button onClick={handleCopyToClipboard}>
            Copy to Clipboard
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Use this mock data to simulate responses from the Circle.so webhook
      </CardFooter>
    </Card>
  );
};

export default CircleMockData; 