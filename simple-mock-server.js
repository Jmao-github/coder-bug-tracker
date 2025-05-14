// Simple mock webhook server using Node's built-in http module
import http from 'http';

const port = 8083; // Use a different port

// Sample mock data that matches the Circle.so format from the screenshot
const MOCK_CIRCLE_ISSUES = [
  {
    "id": "151887991",
    "edited_at": "2025-05-01T02:14:22.000Z",
    "created_at": "2025-05-01T02:11:28.952Z",
    "chat_room_uuid": "14bld17b-f671-45b7-bd05-86ccc0e4e45e",
    "chat_room_participant_id": "1613887316",
    "body": "I've been playing around with multi-agent AI systems (i.e. AutoGen). It sounds amazing. However, once you try it out even with recent frameworks like Google ADK and OpenAI Agents SDK, it just doesn't work. Once you overcome the frustration after lots of work just setting up different agents only leading to the failure, you just give up on it. If you think about this sort of project, it is obvious that multi-agent system would replace a lot of classic ways of programming work, which would require large amount of work (although that would require less work than classic programming. The question is, we are all trained to use multi-agent systems this year, right? So we can we reduce this frustration? I choose to explore the following: 1. Clearly identify the challenges involved when creating multi-agent. 2. Show concrete strategies to address those challenges. This topic would be really something everyone in the community would appreciate. If you have time, this is something you can showcase in your YouTube channel.",
    "sent_at": "2025-05-01T02:11:28.952Z",
    "replies_count": 0,
    "sender": {
      "id": "1613887316",
      "name": "Sean Park",
      "community_member_id": "38842236",
      "user_public_id": "6957zeos",
      "avatar_url": "https://app.circle.so/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBCM3FzUFE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--C2kSUFVFS1zeWCT8oxDa5+dXyjSYImYm1S0z*cD8OTjw--ZT0F1kY8oJRBU2JE3FY0Ukw--OdZN5GlU50qlhx2Z2SMCM3dsk8MlVLtb23ZQMXaH+suWQlYwUHMKxhc8/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdDRG9TY21WemFYcGxYM1J2WDJacGJHeGJCMmtDYUFFPSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--5aee14df45c1e11972f2a1be9c3ca3d31a26b3bb/avatar.png"
    },
    "reactions": [
      {
        "emoji": "thumbsup",
        "count": 1,
        "community_member_ids": [
          "37950686"
        ]
      }
    ],
    "attachments": [],
    "chat_thread_id": null,
    "parent_message_id": null,
    "total_thread_participants_count": 0
  },
  {
    "id": "151832674",
    "edited_at": null,
    "created_at": "2025-05-01T07:13:36.517Z", 
    "chat_room_uuid": "14bld17b-f671-45b7-bd05-86ccc0e4e45e",
    "chat_room_participant_id": "1613887316",
    "body": "I'm a person working on data science projects like a lot and audience is. The crux of our workflow is to create a chatbot with web UI providing features with sort of new technologies. The website doesn't need to be complicated, but should be functional. One of the recurring debates in the choice of tools: 1. Chainlit vs Streamlit vs custom UI (i.e. Django). 2. Anthropic RAG vs OpenAI Agents SDK vs Google ADK (Chainlit is quite good except that customization is not easy). I'm curious what the comprehensive one is. Some sort of guidance in this space would be great.",
    "sent_at": "2025-05-01T07:13:36.517Z",
    "replies_count": 0,
    "sender": {
      "id": "1613887316",
      "name": "Sean Park",
      "community_member_id": "38842236", 
      "user_public_id": "6957zeos",
      "avatar_url": "https://app.circle.so/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBCM3FzUFE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--C2kSUFVFS1zeWCT8oxDa5+dXyjSYImYm1S0z*cD8OTjw--ZT0F1kY8oJRBU2JE3FY0Ukw--OdZN5GlU50qlhx2Z2SMCM3dsk8MlVLtb23ZQMXaH+suWQlYwUHMKxhc8/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdDRG9TY21WemFYcGxYM1J2WDJacGJHeGJCMmtDYUFFPSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--5aee14df45c1e11972f2a1be9c3ca3d31a26b3bb/avatar.png"
    },
    "reactions": [
      {
        "emoji": "pray",
        "count": 1,
        "community_member_ids": [
          "37950686"
        ]
      }
    ],
    "attachments": [],
    "chat_thread_id": null,
    "parent_message_id": null,
    "total_thread_participants_count": 0
  },
  {
    "id": "151825866",
    "edited_at": null,
    "created_at": "2025-05-02T06:53:53.684Z",
    "chat_room_uuid": "14bld17b-f671-45b7-bd05-86ccc0e4e45e", 
    "chat_room_participant_id": "1617763337",
    "body": "Has anyone tried to build a knowledge graph from user docs and source code using LLMs? Something like this but deeper (https://github.com/brendandocusenn/ctxslt/tree/main) (https://github.com/brendandocusenn/ctxslt/tree/mini)",
    "sent_at": "2025-05-02T06:53:53.684Z",
    "replies_count": 0,
    "sender": {
      "id": "1617763337",
      "name": "Victor Stepanov",
      "community_member_id": "38133490",
      "user_public_id": "689764611",
      "avatar_url": "https://app.circle.so/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBCM3FzUFE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--C2kSUFVFS1zeWCT8oxDa5+dXyjSYImYm1S0z*cD8OTjw--ZT0F1kY8oJRBU2JE3FY0Ukw--OdZN5GlU50qlhx2Z2SMCM3dsk8MlVLtb23ZQMXaH+suWQlYwUHMKxhc8/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdDRG9TY21WemFYcGxYM1J2WDJacGJHeGJCMmtDc0FFPSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--86d5fb1bf9f9de1c44412f4c4e413284c466a0/avatar.png"
    },
    "reactions": [],
    "attachments": [],
    "chat_thread_id": null,
    "parent_message_id": null,
    "total_thread_participants_count": 0
  }
];

// Create a server
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Handle CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204; // No content
    res.end();
    return;
  }
  
  // Only handle GET requests to our webhook endpoint
  if (req.method === 'GET' && req.url === '/webhook-test/issue-update') {
    // Create a copy of the mock data but add a timestamp to make unique IDs each time
    const responseData = MOCK_CIRCLE_ISSUES.map(issue => {
      const timestamp = Date.now();
      return {
        ...issue,
        id: issue.id + "-" + timestamp.toString().slice(-6)
      };
    });
    
    // Log the response
    console.log(`Responding with ${responseData.length} mock Circle.so issues`);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    
    // Send the response
    res.end(JSON.stringify(responseData));
  } else {
    // Handle unknown routes
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start the server
server.listen(port, () => {
  console.log(`Mock webhook server running at http://localhost:${port}`);
  console.log(`Test the webhook at: http://localhost:${port}/webhook-test/issue-update`);
}); 