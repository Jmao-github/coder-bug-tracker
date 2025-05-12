import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Settings } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="container my-12 grid gap-6">
      <h1 className="text-3xl font-bold text-center mb-6">Issue Tracker Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" />
              Issues
            </CardTitle>
            <CardDescription>
              View, filter, and manage all issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Access the main issue tracking interface where you can view issues by status, 
              segment, and other criteria. Add comments and update issue statuses.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/issues">Go to Issues</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Admin Panel
            </CardTitle>
            <CardDescription>
              Administrative tools and data management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Access admin tools to manage test data, configure system settings, 
              and implement data integrations like the Circle → Supabase pipeline.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin">Go to Admin Panel</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
