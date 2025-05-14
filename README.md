# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/6d3ea69e-6fa3-4c0f-ad79-a885c9d0ed8f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6d3ea69e-6fa3-4c0f-ad79-a885c9d0ed8f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6d3ea69e-6fa3-4c0f-ad79-a885c9d0ed8f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Circle.so Integration with n8n Webhook

This project includes a bug tracking system that integrates with Circle.so community posts through n8n webhooks. 

### Key Features

- Import issues from Circle.so posts and threads
- Automatic categorization of issues into segments (auth, code, tool, misc)
- Track issue status and resolution
- Maintain connection to original Circle.so messages

### Testing the Webhook Integration

This project includes several tools to help test the Circle.so integration:

1. **Admin Panel**: Navigate to `/admin` to access tools for testing and managing the integration
   - View and manage imported issues
   - Run manual sync with n8n webhook
   - Test webhook connections
   - Generate mock data

2. **Mock Webhook Server**: For local development, you can use the included mock webhook server:
   ```sh
   # Install required dependencies
   npm install express cors body-parser
   
   # Run the mock server
   node src/services/mockWebhookServer.js
   
   # Test the webhook at http://localhost:3001/webhook-test/issue-update
   ```

3. **WebhookTester Component**: The Admin Panel includes a built-in webhook tester that shows detailed request/response information

4. **Circle Mock Data Generator**: Generate and customize test data for simulating Circle.so messages

### Configuring n8n Webhook

To use with your own n8n instance:

1. Set up an n8n workflow with a webhook trigger
2. Update the webhook URL in `src/services/circleService.ts`
3. Configure proper authentication if needed

You can find more information about setting up n8n webhooks in the [n8n documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/).
