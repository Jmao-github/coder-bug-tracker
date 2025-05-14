import React, { useState, useEffect } from 'react';
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
import { CircleMessage, syncCircleMessagesFromN8n, SyncResult, createIssueFromCircleMessage, processWebhookData } from '@/services/circleService';
import WebhookTester from '@/components/WebhookTester';
import CircleMockData from '@/components/CircleMockData';
import FileUploader from '@/components/FileUploader';
import { initStorage, ensureAttachmentsColumn } from '@/services/storageService';
import AttachmentViewer from '@/components/AttachmentViewer';
import { useNavigate } from 'react-router-dom';

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
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null); 
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
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
  const [attachments, setAttachments] = useState<string[]>([]);
  
  // Initialize storage when component mounts
  useEffect(() => {
    // Initialize storage bucket
    initStorage().then(success => {
      if (success) {
        console.log('Storage initialized successfully');
        
        // Then ensure the circle_issues table has the attachments column
        ensureAttachmentsColumn().then(columnSuccess => {
          if (columnSuccess) {
            console.log('Attachments column is ready');
          } else {
            console.error('Failed to set up attachments column');
            toast.error('Could not set up attachments support. Some features may not work.');
          }
        });
      }
    });
  }, []);

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
  
  // Handle file upload
  const handleFileUploaded = (url: string) => {
    setAttachments(prev => [...prev, url]);
  };

  // Mutation for manually creating a Circle issue for testing
  const createCircleIssueMutation = useMutation({
    mutationFn: async () => {
      if (!messageId || !title || !body || !authorName) {
        throw new Error('Missing required fields');
      }
      
      try {
        // Create the unified Circle message JSON structure
        const circleMessage = {
          Type: threadId ? 'thread' : 'single',
          Parent_Message: {
            chat_thread_id: parseInt(threadId || messageId),
            message_id: parseInt(messageId),
            parent_id: null,
            chat_room_uuid: spaceId || null,
            space_name: spaceName || 'Test Space',
            [threadId ? 'parent_sender' : 'sender']: authorName,
            created_at: new Date().toISOString(),
            edited_at: null,
            body: body,
            attachments: attachments,
            message_url: link || '',
            has_replies: false,
            replies_count: 0
          },
          Replies: [],
          Issue_Details: {
            is_issue: true,
            issue_title: title,
            type: 'Test',
            reasoning: 'Manually created test issue'
          }
        };
        
        // Use the upsert_circle_message function to create the record
        const { data, error } = await supabase.rpc(
          'upsert_circle_message',
          { p_raw_json: circleMessage }
        );
        
        if (error) {
          throw error;
        }
        
        toast.success('Circle message created successfully!');
        return data;
      } catch (error) {
        console.error('Error creating Circle message:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Clear the form
      setMessageId('');
      setThreadId('');
      setTitle('');
      setBody('');
      setAuthorName('');
      setAuthorEmail('');
      setSpaceId('');
      setSpaceName('');
      setLink('');
      setAttachments([]);
      
      toast.success('Circle message created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create Circle message: ${error.message}`);
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

  // Mutation for n8n webhook sync
  const syncCircleIssuesMutation = useMutation({
    mutationFn: async () => {
      return await syncCircleMessagesFromN8n();
    },
    onSuccess: (data) => {
      setSyncResult(data);
      toast.success(`Successfully processed ${data.processedCount} issues`);
      queryClient.invalidateQueries({ queryKey: ['all-issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue-counts'] });
      queryClient.invalidateQueries({ queryKey: ['status-counts'] });
      queryClient.invalidateQueries({ queryKey: ['circle-messages'] });
    },
    onError: (error) => {
      toast.error(`Failed to sync Circle issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Handler for the sync button
  const handleSyncCircleIssues = async () => {
    syncCircleIssuesMutation.mutate();
  };

  // Handle webhook test success
  const handleWebhookTestSuccess = async (data: any) => {
    try {
      console.log('Webhook test response:', data);
      
      // Check if we got a valid response
      if (!data) {
        toast.warning('Received empty response from webhook');
        return;
      }
      
      // Process the webhook data directly
      const result = await processWebhookData(data);
      
      // Update the UI with the results
      setSyncResult(result);
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['circle-messages'] });
      queryClient.invalidateQueries({ queryKey: ['all-issues'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error processing webhook response';
      toast.error(message);
    }
  };

  // Query to fetch recent Circle issues
  const { data: circleMessages = [], isLoading: isCircleMessagesLoading } = useQuery({
    queryKey: ['circle-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('circle_messages')
        .select('*')
        .order('imported_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching Circle messages:', error);
        toast.error('Failed to load Circle messages');
        throw error;
      }
      
      return data || [];
    }
  });

  // Function to create an issue from a Circle message
  const handleCreateIssueFromCircle = async (messageId: string) => {
    try {
      if (!profile?.name) {
        toast.error('You must be logged in to create an issue');
        return;
      }
      
      const issueId = await createIssueFromCircleMessage(messageId, profile.name);
      toast.success('Issue created successfully!');
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['all-issues'] });
      queryClient.invalidateQueries({ queryKey: ['circle-messages'] });
      
    } catch (error) {
      console.error('Error creating issue from Circle:', error);
      toast.error(`Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="circle-import" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="circle-import">Circle Import</TabsTrigger>
          <TabsTrigger value="n8n-sync">n8n Sync</TabsTrigger>
          <TabsTrigger value="n8n-test">n8n Webhook Test</TabsTrigger>
          <TabsTrigger value="circle-mock-data">Circle Mock Data</TabsTrigger>
          <TabsTrigger value="recent-issues">Recent Issues</TabsTrigger>
          <TabsTrigger value="test-data">Test Data Manager</TabsTrigger>
        </TabsList>
        
        <TabsContent value="circle-import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Circle Data Import</CardTitle>
              <CardDescription>
                Manually create a Circle.so issue for testing the import process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              
              <div className="space-y-2">
                <Label>Attachments</Label>
                <FileUploader 
                  onFileUploaded={handleFileUploaded}
                  maxFiles={3}
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="n8n-sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>n8n Circle.so Sync</CardTitle>
              <CardDescription>
                Fetch new issues from Circle.so via the n8n webhook and import them into the bug tracker.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Webhook Information</AlertTitle>
                <AlertDescription>
                  This will trigger the n8n webhook at <code>https://jayeworkflow.app.n8n.cloud/webhook-test/issue-update</code> to 
                  fetch and process Circle.so issues. Make sure the webhook is properly configured and active.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-between items-center">
                <Button 
                  onClick={handleSyncCircleIssues} 
                  disabled={syncCircleIssuesMutation.isPending}
                  variant="default"
                  className="space-x-2"
                >
                  {syncCircleIssuesMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Run Issue Sync</span>
                    </>
                  )}
                </Button>
              </div>
              
              {syncResult && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-lg font-medium">Sync Results</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded border border-green-200">
                      <p className="text-sm text-green-800 font-medium">Processed</p>
                      <p className="text-3xl font-bold text-green-600">{syncResult.processedCount}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium">Imported</p>
                      <p className="text-3xl font-bold text-blue-600">{syncResult.importedIds.length}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded border border-red-200">
                      <p className="text-sm text-red-800 font-medium">Errors</p>
                      <p className="text-3xl font-bold text-red-600">{syncResult.errors.length}</p>
                    </div>
                  </div>
                  
                  {syncResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-red-800">Error Details</h4>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {syncResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="n8n-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>n8n Webhook Direct Testing</CardTitle>
              <CardDescription>
                Test the n8n webhook directly without going through the sync process. This helps debug issues with the n8n webhook.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Make sure your n8n workflow is active and listening for webhook triggers before testing.
                </AlertDescription>
              </Alert>
              
              <WebhookTester 
                webhookUrl="https://jayeworkflow.app.n8n.cloud/webhook-test/issue-update"
                onSuccess={handleWebhookTestSuccess}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="circle-mock-data" className="space-y-4">
          <CircleMockData />
        </TabsContent>
        
        <TabsContent value="recent-issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Circle.so Issues</CardTitle>
              <CardDescription>
                View recently imported issues from Circle.so including their attachments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCircleMessagesLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : circleMessages.length > 0 ? (
                <div className="space-y-6">
                  {circleMessages.map((message: any) => (
                    <div key={message.id} className="border rounded-md p-4 space-y-3">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{message.issue_title || message.title}</h3>
                        <span className="text-sm text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{message.body}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-gray-100 rounded-full px-2 py-1">
                          {message.sender || message.author_name}
                        </span>
                        {message.mapped_to_issue_id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/issues/${message.mapped_to_issue_id}`)}
                          >
                            View Issue <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateIssueFromCircle(message.id)}
                          >
                            Create Issue <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No Circle messages found. Use the webhook to import some.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="test-data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Data Management</CardTitle>
              <CardDescription>
                Manage test issues in the database. Test issues are issues that have the is_test flag set to true.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
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
      </Tabs>
    </div>
  );
};

export default Admin; 