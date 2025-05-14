// mockWebhookServer.js
// This is a simple Express server that can be used to simulate the n8n webhook
// for local development and testing.
//
// To use:
// 1. Install dependencies: npm install express cors body-parser
// 2. Run with: node mockWebhookServer.js
// 3. Test with: http://localhost:3001/webhook-test/issue-update

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

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

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// Mock webhook endpoint
app.get('/webhook-test/issue-update', (req, res) => {
  console.log('Received webhook request');
  
  // Add timestamp to make IDs unique each time
  const responseData = SAMPLE_MOCK_DATA.map(item => {
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
  
  // Add a delay to simulate network latency
  setTimeout(() => {
    res.json(responseData);
    console.log('Sent response:', responseData);
  }, 500);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock webhook server running at http://localhost:${PORT}`);
  console.log(`Test the webhook at: http://localhost:${PORT}/webhook-test/issue-update`);
}); 