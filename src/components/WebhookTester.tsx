import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2, RefreshCw, AlertTriangle, Send } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface WebhookTesterProps {
  webhookUrl: string;
  onSuccess?: (data: any) => void;
}

const WebhookTester: React.FC<WebhookTesterProps> = ({ webhookUrl, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isN8nLoading, setIsN8nLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  
  // Always use the real webhook URL for n8n testing
  const n8nWebhookUrl = 'https://jayeworkflow.app.n8n.cloud/webhook-test/issue-update';
  
  // Determine which webhook URL to use for general testing
  const isDevelopment = import.meta.env.MODE === 'development';
  const actualWebhookUrl = isDevelopment 
    ? 'http://localhost:8083/webhook-test/issue-update'  // Local mock server
    : webhookUrl; // Use provided URL in production

  const testWebhook = async (method: 'GET' | 'POST' = 'GET') => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);
    
    const startTime = Date.now();
    
    try {
      // Call the webhook
      const response = await fetch(actualWebhookUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        ...(method === 'POST' && {
          body: JSON.stringify({
            action: "test",
            timestamp: Date.now()
          })
        })
      });
      
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setStatusCode(response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook returned status ${response.status}: ${errorText}`);
      }
      
      // Parse the response
      const data = await response.json();
      setResponse(data);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const testN8nWebhook = async () => {
    setIsN8nLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);
    
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
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsN8nLoading(false);
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
    <Card>
      <CardHeader>
        <CardTitle>Webhook Tester</CardTitle>
        <CardDescription>
          Test the Circle.so integration with n8n webhooks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="mock">
          <TabsList className="mb-4">
            <TabsTrigger value="mock">Mock Server</TabsTrigger>
            <TabsTrigger value="n8n">Real n8n Webhook</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mock">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Testing with Mock Server</AlertTitle>
              <AlertDescription>
                This will make a request to the local mock server at <code>{actualWebhookUrl}</code>
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-between items-center mt-4">
              <div className="space-x-2">
                <Button 
                  onClick={() => testWebhook('GET')} 
                  disabled={isLoading}
                  variant="outline"
                  className="space-x-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Test GET</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => testWebhook('POST')} 
                  disabled={isLoading}
                  variant="outline"
                  className="space-x-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Test POST</span>
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
          </TabsContent>
          
          <TabsContent value="n8n">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Live n8n Webhook</AlertTitle>
              <AlertDescription>
                This will make a real POST request to the n8n webhook at <code>{n8nWebhookUrl}</code>. 
                Make sure the n8n workflow is active and listening for triggers.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-between items-center mt-4">
              <Button 
                onClick={testN8nWebhook} 
                disabled={isN8nLoading}
                variant="default"
                className="space-x-2"
              >
                {isN8nLoading ? (
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
              
              {statusCode && (
                <div className="text-sm">
                  Status: <span className={statusCode >= 200 && statusCode < 300 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {statusCode}
                  </span>
                  {responseTime && <span className="ml-2">({responseTime}ms)</span>}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
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
            <h3 className="text-md font-medium mb-2">Response:</h3>
            <ScrollArea className="h-64 border rounded-md bg-muted p-2">
              <Textarea 
                readOnly 
                value={formatJson(response)} 
                className="w-full font-mono text-xs bg-transparent border-none resize-none focus-visible:ring-0 h-full"
              />
            </ScrollArea>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Response will be shown in raw format for debugging purposes.
      </CardFooter>
    </Card>
  );
};

export default WebhookTester; 