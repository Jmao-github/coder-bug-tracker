import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { processWebhookData } from '@/services/circleService';
import { supabase } from '@/integrations/supabase/client';

const Admin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [processingStats, setProcessingStats] = useState<any>(null);
  
  // The real n8n webhook URL
  const n8nWebhookUrl = 'https://jayeworkflow.app.n8n.cloud/webhook-test/issue-update';
  
  // Process items one by one using the handle_circle_webhook RPC
  const processBatchDirectly = async (items: any[]) => {
    try {
      // Call the handle_circle_webhook function directly
      const { data, error } = await supabase.rpc(
        'handle_circle_webhook',
        { request: items }
      );
        
      if (error) {
        console.error('Error calling handle_circle_webhook:', error);
        return {
          processedCount: 0,
          importedIds: [],
          errors: [error.message]
        };
      }
      
      // The function returns an object with processed, imported, and errors
      return {
        processedCount: data.processed || 0,
        importedIds: data.imported || [],
        errors: data.errors || []
      };
    } catch (err) {
      console.error('Exception in processBatchDirectly:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        processedCount: 0,
        importedIds: [],
        errors: [errorMessage]
      };
    }
  };
  
  // Process items one by one when received as a batch
  const processBatchSequentially = async (items: any[]) => {
    const results = {
      processedCount: 0,
      importedIds: [] as string[],
      errors: [] as string[]
    };
    
    // Use the DB function instead of processing one by one
    try {
      const batchResults = await processBatchDirectly(items);
      return batchResults;
    } catch (mainError) {
      console.error('Failed to process batch directly, falling back to individual processing:', mainError);
      
      // Process each item in sequence as fallback
      for (const item of items) {
        try {
          // Call the process_circle_webhook function for each item individually
          const { data, error } = await supabase.rpc(
            'process_circle_webhook',
            { 
              p_payload: item,
              p_import_source: 'admin_panel',
              p_imported_by: 'admin'
            }
          );
          
          if (error) {
            results.errors.push(`Error processing item: ${error.message}`);
            continue;
          }
          
          results.processedCount++;
          
          if (data && data.circle_issue_id) {
            results.importedIds.push(data.circle_issue_id);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.errors.push(`Exception: ${errorMessage}`);
        }
      }
      
      return results;
    }
  };
  
  const triggerN8nWebhook = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);
    setProcessingStats(null);
    
    const startTime = Date.now();
    
    try {
      // Call the real n8n webhook with POST
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          action: "sync",
          timestamp: Date.now()
        })
      });
      
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setStatusCode(response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n webhook returned status ${response.status}: ${errorText}`);
      }
      
      // Parse the response
      const data = await response.json();
      setResponse(data);
      
      // Process the webhook data - handle both arrays and single items
      try {
        let result;
        
        if (Array.isArray(data)) {
          console.log(`Processing ${data.length} items as a batch`);
          result = await processBatchSequentially(data);
        } else {
          // For a single item, use the handle_circle_webhook function
          const { data: singleResult, error: singleError } = await supabase.rpc(
            'handle_circle_webhook',
            { request: data }
          );
          
          if (singleError) {
            throw new Error(`Error processing single item: ${singleError.message}`);
          }
          
          result = {
            processedCount: singleResult.processed || 0,
            importedIds: singleResult.imported || [],
            errors: singleResult.errors || []
          };
        }
        
        setProcessingStats(result);
        
        if (result.importedIds.length > 0) {
          toast.success(`Successfully imported ${result.importedIds.length} issues`);
        } else {
          toast.warning('No new issues were found to import');
        }
        
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} errors occurred during import`);
        }
      } catch (processError) {
        console.error('Error processing webhook data:', processError);
        toast.error('Failed to process webhook data');
        setError(processError instanceof Error ? processError.message : 'Unknown processing error');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast.error('Failed to trigger webhook');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return 'Error formatting JSON';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
          <Card>
            <CardHeader>
          <CardTitle>n8n Webhook Trigger</CardTitle>
              <CardDescription>
            Trigger the n8n webhook to fetch and process new issue data from Circle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Make sure your n8n workflow is active and properly configured before triggering the webhook.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-between items-center mt-4">
            <div>
              <Button 
                onClick={triggerN8nWebhook} 
                disabled={isLoading}
                variant="default"
                className="space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Triggering n8n...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Trigger n8n Webhook</span>
                  </>
                )}
              </Button>
            </div>
              
            {statusCode && (
              <div className="text-sm">
                Status: <span className={statusCode >= 200 && statusCode < 300 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {statusCode}
                </span>
                {responseTime && <span className="ml-2">({responseTime}ms)</span>}
              </div>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                {error}
                </AlertDescription>
              </Alert>
          )}
          
          {response && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Incoming Data from n8n</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-xs">
                <pre>{Array.isArray(response) ? 
                  `Received batch of ${response.length} items` : 
                  formatJson(response)}</pre>
              </div>
            </div>
          )}
          
          {processingStats && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Processing Results</h3>
              <div className="bg-white dark:bg-gray-900 border p-4 rounded-md">
                  <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Processed</p>
                    <p className="text-xl font-bold">{processingStats.processedCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Imported</p>
                    <p className="text-xl font-bold text-green-600">{processingStats.importedIds.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Errors</p>
                    <p className="text-xl font-bold text-red-600">{processingStats.errors.length}</p>
                    </div>
                    </div>
                
                {processingStats.importedIds.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">Imported IDs:</p>
                    <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {processingStats.importedIds.join(', ')}
                    </div>
                  </div>
                )}
                  
                {processingStats.errors.length > 0 && (
                    <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">Errors:</p>
                    <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded text-red-600">
                      <ul className="list-disc pl-4">
                        {processingStats.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                </div>
                        )}
                      </div>
                </div>
              )}
            </CardContent>
          </Card>
    </div>
  );
};

export default Admin; 