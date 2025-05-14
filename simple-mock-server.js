// Simple mock server for testing n8n webhook payloads with our test data
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 8083;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Read the test data from the file
const readTestData = () => {
  try {
    const filePath = path.resolve('./notes/Phase A - Data migrate to Supabase/n8n webhook payload.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // The file has multiple JSON objects, separated by newlines
    // We need to parse them individually
    const jsonObjects = [];
    let currentObject = '';
    let inObject = false;
    
    for (const line of fileContent.split('\n')) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('{') && !inObject) {
        inObject = true;
        currentObject = trimmedLine;
      } else if (inObject) {
        currentObject += '\n' + line;
        
        if (trimmedLine.endsWith('}') && (currentObject.split('{').length === currentObject.split('}').length)) {
          inObject = false;
          try {
            const parsedObject = JSON.parse(currentObject);
            jsonObjects.push(parsedObject);
            currentObject = '';
          } catch (e) {
            // Not a complete object yet, continue
          }
        }
      }
    }
    
    return jsonObjects;
  } catch (error) {
    console.error('Error reading test data:', error);
    return [];
  }
};

// Mock webhook endpoint
app.get('/webhook-test/issue-update', (req, res) => {
  console.log('Received GET request to /webhook-test/issue-update');
  
  const testData = readTestData();
  console.log(`Responding with ${testData.length} test objects`);
  
  // Return the test data
  res.json(testData);
});

// Mock webhook endpoint for POST requests
app.post('/webhook-test/issue-update', (req, res) => {
  console.log('Received POST request to /webhook-test/issue-update');
  
  const testData = readTestData();
  console.log(`Responding with ${testData.length} test objects`);
  
  // Return the test data
  res.json(testData);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test webhook server running at http://localhost:${PORT}`);
  console.log(`Test the webhook at: http://localhost:${PORT}/webhook-test/issue-update`);
}); 