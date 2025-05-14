// Mock webhook server for testing Circle.so integration
import express from 'express';
import cors from 'cors';
const app = express();
const port = 8082;

// Sample mock data for testing
const MOCK_CIRCLE_ISSUES = [
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

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Mock route for n8n webhook
app.get('/webhook-test/issue-update', (req, res) => {
  console.log('Received request to /webhook-test/issue-update');
  
  // Create a copy of the mock data with new IDs for each request
  const responseData = MOCK_CIRCLE_ISSUES.map(issue => {
    const newId = "msg_" + Date.now() + Math.floor(Math.random() * 1000);
    return {
      ...issue,
      id: newId,
      message: {
        ...issue.message,
        content: {
          ...issue.message.content,
          message_id: newId
        }
      }
    };
  });
  
  // Log the response for debugging
  console.log(`Responding with ${responseData.length} mock issues`);
  
  // Return the mock data
  res.json(responseData);
});

// Start the server
app.listen(port, () => {
  console.log(`Mock webhook server running at http://localhost:${port}`);
  console.log(`Test the webhook at: http://localhost:${port}/webhook-test/issue-update`);
}); 