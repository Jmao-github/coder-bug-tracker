import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2, RefreshCw, AlertTriangle, Download, Circle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Issue } from '@/types/issueTypes';
import { useProfile } from '@/components/ProfileContext';
import { CircleIssue } from '@/services/circleService';

// Define types for mutations and queries
type DeleteResult = {
  deleted: number;
};

type TestIssue = {
  id: string;
};

type MarkResult = {
  success: boolean;
};

const Admin: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  
  // State for Circle Import
  const [messageId, setMessageId] = useState('');
  const [threadId, setThreadId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [spaceName, setSpaceName] = useState('');
  const [link, setLink] = useState('');
  
  // Query to count test issues
  const { data: testIssuesCount = 0, isLoading: isCountLoading, refetch: refetchCount } = useQuery({
    queryKey: ['test-issues-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('issues')
        .select('*', { count: 'exact' })
        .eq('is_test', true);
        
      if (error) {
        console.error('Error counting test issues:', error);
        toast.error('Failed to count test issues');
        return 0;
      }
      
      return count || 0;
    }
  });

  // Mutation to delete all test issues
  const deleteTestIssuesMutation = useMutation<DeleteResult, Error>({
    mutationFn: async (): Promise<DeleteResult> => {
      setIsDeleting(true);
      try {
        // 1. Get all test issue IDs
        const { data: testIssues, error: fetchError } = await supabase
          .from('issues')
          .select('id')
          .eq('is_test', true);
          
        if (fetchError) {
          throw new Error(`Error fetching test issues: ${fetchError.message}`);
        }
        
        if (!testIssues || testIssues.length === 0) {
          return { deleted: 0 };
        }
        
        const issueIds = testIssues.map((issue: TestIssue) => issue.id);
        
        // 2. Delete related comments
        const { error: commentsError } = await supabase
          .from('comments')
          .delete()
          .in('issue_id', issueIds);
          
        if (commentsError) {
          console.error('Error deleting comments:', commentsError);
          // Continue with issue deletion even if comment deletion fails
        }
        
        // 3. Delete related status logs
        const { error: logsError } = await supabase
          .from('issue_status_logs')
          .delete()
          .in('issue_id', issueIds);
          
        if (logsError) {
          console.error('Error deleting status logs:', logsError);
          // Continue with issue deletion even if logs deletion fails
        }
        
        // 4. Delete related issue tags
        const { error: tagsError } = await supabase
          .from('issue_tags')
          .delete()
          .in('issue_id', issueIds);
          
        if (tagsError) {
          console.error('Error deleting issue tags:', tagsError);
          // Continue with issue deletion even if tags deletion fails
        }
        
        // 5. Finally delete the issues
        const { error: issuesError } = await supabase
          .from('issues')
          .delete()
          .eq('is_test', true);
          
        if (issuesError) {
          throw new Error(`Error deleting test issues: ${issuesError.message}`);
        }
        
        return { deleted: testIssues.length };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error deleting test issues';
        throw new Error(message);
      } finally {
        setIsDeleting(false);
      }
    },
    onSuccess: (data) => {
      toast.success(`Successfully deleted ${data.deleted} test issues`);
      queryClient.invalidateQueries({ queryKey: ['test-issues-count'] });
      queryClient.invalidateQueries({ queryKey: ['all-issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue-counts'] });
      queryClient.invalidateQueries({ queryKey: ['status-counts'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete test issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Handler for the delete button
  const handleDeleteTestIssues = async () => {
    if (confirm('Are you sure you want to delete all test issues? This action cannot be undone.')) {
      deleteTestIssuesMutation.mutate();
    }
  };

  // Function to mark all existing issues as test issues for debugging
  const markAllAsTestIssuesMutation = useMutation<MarkResult, Error>({
    mutationFn: async (): Promise<MarkResult> => {
      try {
        // Update only issues that don't have is_test set yet
        const { error } = await supabase
          .from('issues')
          .update({ is_test: true } as Partial<Issue>)
          .is('is_test', null);
          
        if (error) {
          throw new Error(`Error marking issues as test: ${error.message}`);
        }
        
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error marking test issues';
        throw new Error(message);
      }
    },
    onSuccess: () => {
      toast.success('Successfully marked issues as test issues');
      refetchCount();
    },
    onError: (error) => {
      toast.error(`Failed to mark issues as test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Mutation for manually creating a Circle issue for testing
  const createCircleIssueMutation = useMutation({
    mutationFn: async () => {
      if (!messageId || !title || !body || !authorName) {
        throw new Error('Missing required fields');
      }
      
      try {
        // 1. Create the Circle issue record
        const circleIssue: CircleIssue = {
          message_id: messageId,
          thread_id: threadId || undefined,
          title,
          body,
          author_name: authorName,
          author_email: authorEmail || undefined,
          space_id: spaceId || undefined,
          space_name: spaceName || undefined,
          link: link || undefined,
          is_thread: !!threadId,
          is_triaged: true,
          triage_confidence: 0.95
        };
        
        // Use the upsert_circle_issue function to create or update the record
        const { data, error } = await supabase.rpc(
          'upsert_circle_issue',
          {
            p_message_id: circleIssue.message_id,
            p_thread_id: circleIssue.thread_id || null,
            p_title: circleIssue.title,
            p_body: circleIssue.body,
            p_author_name: circleIssue.author_name,
            p_author_email: circleIssue.author_email || null,
            p_space_name: circleIssue.space_name || null,
            p_space_id: circleIssue.space_id || null,
            p_link: circleIssue.link || null,
            p_is_thread: circleIssue.is_thread || false,
            p_is_triaged: circleIssue.is_triaged || false,
            p_triage_confidence: circleIssue.triage_confidence || 0,
            p_raw_data: null
          }
        );
        
        if (error) {
          throw new Error(`Error creating Circle issue: ${error.message}`);
        }
        
        // 2. Now create an issue in the issues table from the Circle data
        const { data: issue, error: createError } = await supabase
          .from('issues')
          .insert({
            title: circleIssue.title,
            description: `${circleIssue.body}\n\n*Imported from Circle*\n${circleIssue.link || ''}`,
            tags: ['circle', 'imported'],
            segment: determineSegment(circleIssue.title, circleIssue.body),
            status: 'in_progress',
            submitted_by: profile?.name || authorName,
            is_test: false // This is real data, not test data
          })
          .select()
          .single();
          
        if (createError) {
          throw new Error(`Error creating issue: ${createError.message}`);
        }
        
        // 3. Update the Circle issue with the mapped issue ID
        const { error: updateError } = await supabase
          .from('circle_issues')
          .update({ mapped_to_issue_id: issue.id })
          .eq('message_id', circleIssue.message_id);
          
        if (updateError) {
          console.error('Error updating Circle issue mapping:', updateError);
          // Continue despite error
        }
        
        // 4. Add an import log entry
        const { error: logError } = await supabase
          .from('issue_import_logs')
          .insert({
            circle_issue_id: data,
            issue_id: issue.id,
            imported_by: profile?.name || 'Admin',
            import_source: 'manual',
            import_notes: 'Manually created via admin panel',
            is_automatic: false
          });
          
        if (logError) {
          console.error('Error creating import log:', logError);
        }
        
        return { circleIssueId: data, issueId: issue.id };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error creating Circle issue';
        throw new Error(message);
      }
    },
    onSuccess: () => {
      toast.success('Successfully created issue from Circle data');
      
      // Clear form
      setMessageId('');
      setThreadId('');
      setTitle('');
      setBody('');
      setAuthorName('');
      setAuthorEmail('');
      setSpaceId('');
      setSpaceName('');
      setLink('');
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['all-issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue-counts'] });
      queryClient.invalidateQueries({ queryKey: ['status-counts'] });
    },
    onError: (error) => {
      toast.error(`Failed to create Circle issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  /**
   * Helper function to determine the likely segment for an issue based on title and body
   */
  const determineSegment = (title: string, body: string): 'auth' | 'code' | 'tool' | 'misc' => {
    const fullText = `${title} ${body}`.toLowerCase();
    
    // Check for auth-related keywords
    if (
      fullText.includes('login') || 
      fullText.includes('auth') || 
      fullText.includes('password') || 
      fullText.includes('sign in') || 
      fullText.includes('signin') ||
      fullText.includes('account')
    ) {
      return 'auth';
    }
    
    // Check for code-related keywords
    if (
      fullText.includes('error') || 
      fullText.includes('bug') || 
      fullText.includes('exception') || 
      fullText.includes('crash') || 
      fullText.includes('function') ||
      fullText.includes('method') ||
      fullText.includes('class') ||
      fullText.includes('component')
    ) {
      return 'code';
    }
    
    // Check for tool-related keywords
    if (
      fullText.includes('tool') || 
      fullText.includes('cli') || 
      fullText.includes('command') || 
      fullText.includes('script') || 
      fullText.includes('automation') ||
      fullText.includes('workflow')
    ) {
      return 'tool';
    }
    
    // Default to misc
    return 'misc';
  };

  return (
    <div className="container my-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="test-data">
        <TabsList className="mb-4">
          <TabsTrigger value="test-data">Test Data Management</TabsTrigger>
          <TabsTrigger value="circle-sync">Circle Data Sync</TabsTrigger>
        </TabsList>
        
        <TabsContent value="test-data">
          <Card>
            <CardHeader>
              <CardTitle>Test Issues Management</CardTitle>
              <CardDescription>
                Manage test issues in the database. Test issues are issues that have the is_test flag set to true.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting test issues will permanently remove them from the database, including all related comments and status logs.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center justify-between bg-muted p-4 rounded-md mb-4">
                <div>
                  <h3 className="font-medium">Current test issues:</h3>
                  {isCountLoading ? (
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Counting...
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{testIssuesCount} issues marked as test</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchCount()}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Refresh Count
                </Button>
              </div>
              
              <div className="flex flex-col gap-4">
                <Button 
                  variant="destructive" 
                  disabled={isDeleting || testIssuesCount === 0} 
                  onClick={handleDeleteTestIssues}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete All Test Issues
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => markAllAsTestIssuesMutation.mutate()}
                  disabled={markAllAsTestIssuesMutation.isPending}
                >
                  {markAllAsTestIssuesMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    'Mark All Unmarked Issues as Test'
                  )}
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                The is_test flag helps identify which issues can be safely deleted without affecting real data.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="circle-sync">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Circle className="h-5 w-5 mr-2" /> Circle Data Sync
              </CardTitle>
              <CardDescription>
                Manually create a test Circle issue for development purposes.
                This simulates the n8n workflow that will automatically import issues from Circle.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Alert className="mb-6">
                <Download className="h-4 w-4" />
                <AlertTitle>Test the Pipeline</AlertTitle>
                <AlertDescription>
                  Use this form to create a sample Circle issue and transform it into a bug tracker issue.
                  This will help test the data pipeline without needing to set up the full n8n integration.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="messageId">Message ID (required)</Label>
                    <Input 
                      id="messageId" 
                      placeholder="Unique Circle message ID" 
                      value={messageId}
                      onChange={(e) => setMessageId(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="threadId">Thread ID (optional)</Label>
                    <Input 
                      id="threadId" 
                      placeholder="Circle thread ID" 
                      value={threadId}
                      onChange={(e) => setThreadId(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title (required)</Label>
                  <Input 
                    id="title" 
                    placeholder="Issue title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="body">Body (required)</Label>
                  <Textarea 
                    id="body" 
                    placeholder="Issue description" 
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={5}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="authorName">Author Name (required)</Label>
                    <Input 
                      id="authorName" 
                      placeholder="Name of the person who reported the issue" 
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="authorEmail">Author Email</Label>
                    <Input 
                      id="authorEmail" 
                      placeholder="Email of the person who reported the issue" 
                      value={authorEmail}
                      onChange={(e) => setAuthorEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="spaceName">Space Name</Label>
                    <Input 
                      id="spaceName" 
                      placeholder="Circle space name" 
                      value={spaceName}
                      onChange={(e) => setSpaceName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="spaceId">Space ID</Label>
                    <Input 
                      id="spaceId" 
                      placeholder="Circle space ID" 
                      value={spaceId}
                      onChange={(e) => setSpaceId(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="link">Link to Circle Message</Label>
                  <Input 
                    id="link" 
                    placeholder="URL to the Circle message" 
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full mt-4"
                  disabled={createCircleIssueMutation.isPending || !messageId || !title || !body || !authorName}
                  onClick={() => createCircleIssueMutation.mutate()}
                >
                  {createCircleIssueMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" /> Create Circle Issue & Convert to Bug
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col items-start border-t pt-6">
              <p className="text-sm text-muted-foreground mb-2">
                In production, an n8n workflow will automatically:
              </p>
              <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                <li>Fetch messages from Circle using the Circle API</li>
                <li>Use Claude to analyze and triage potential issues</li>
                <li>Store triaged issues in the circle_issues table</li>
                <li>Create corresponding bug tracker issues</li>
              </ol>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin; 