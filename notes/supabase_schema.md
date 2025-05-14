# Supabase Database Schema Documentation

*Created: 2025-05-12T12:42:02.246-04:00*

## Technical Schema Overview

This document provides a comprehensive overview of our Supabase database schema for the Circle.so to Bug Tracker integration.

### Database Tables

#### Core Issue Tracking

1. **issues**
   - `id`: UUID (Primary Key)
   - `seq_id`: Integer (Sequential ID for human readability)
   - `title`: Text
   - `description`: Text
   - `status`: Text ('waiting_for_help', 'in_progress', 'resolved', 'blocked', 'archived')
   - `segment`: Text ('auth', 'code', 'tool', 'misc')
   - `submitted_by`: Text
   - `assigned_to`: Text (nullable)
   - `tags`: Text Array
   - `created_at`: Timestamp
   - `updated_at`: Timestamp
   - `resolved_by`: Text (nullable)
   - `resolved_at`: Timestamp (nullable)
   - `archived_at`: Timestamp (nullable)
   - `ready_for_delivery`: Boolean (nullable)
   - `is_test`: Boolean

2. **comments**
   - `id`: UUID (Primary Key)
   - `issue_id`: UUID (Foreign Key → issues.id)
   - `author_name`: Text
   - `body`: Text
   - `created_at`: Timestamp

3. **issue_status_logs**
   - `id`: UUID (Primary Key)
   - `issue_id`: UUID (Foreign Key → issues.id)
   - `old_status`: Text
   - `new_status`: Text
   - `changed_by`: Text (nullable)
   - `changed_at`: Timestamp

4. **tags**
   - `name`: Text (Primary Key)
   - `created_at`: Timestamp

5. **issue_tags** (Junction table)
   - `issue_id`: UUID (Foreign Key → issues.id)
   - `tag_name`: Text (Foreign Key → tags.name)

#### Circle.so Integration

6. **circle_issues**
   - `id`: UUID (Primary Key)
   - `message_id`: Text (Unique)
   - `thread_id`: Text (nullable)
   - `title`: Text
   - `body`: Text
   - `author_name`: Text
   - `author_email`: Text (nullable)
   - `space_name`: Text (nullable)
   - `space_id`: Text (nullable)
   - `link`: Text (nullable)
   - `is_thread`: Boolean
   - `is_triaged`: Boolean
   - `triage_confidence`: Float
   - `raw_data`: JSONB
   - `mapped_to_issue_id`: UUID (nullable, references issues.id)
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

7. **circle_spaces**
   - `id`: Serial (Primary Key)
   - `space_id`: BigInt
   - `space_name`: Text
   - `chat_room_uuid`: Text (Unique)
   - `space_member_id`: BigInt
   - `created_at`: Timestamp

8. **issue_import_logs**
   - `id`: UUID (Primary Key)
   - `circle_issue_id`: UUID (Foreign Key → circle_issues.id)
   - `issue_id`: UUID (Foreign Key → issues.id)
   - `imported_by`: Text
   - `import_source`: Text
   - `import_notes`: Text
   - `is_automatic`: Boolean
   - `imported_at`: Timestamp

#### User Management

9. **user_sessions**
   - `id`: UUID (Primary Key)
   - `profile_name`: Text
   - `profile_role`: Text
   - `created_at`: Timestamp
   - `last_active`: Timestamp

### Database Views

1. **issue_activity_log**
   - `id`: UUID 
   - `issue_title`: Text
   - `segment`: Text
   - `status`: Text
   - `assigned_to`: Text
   - `resolved_by`: Text
   - `resolved_at`: Timestamp
   - `last_commenter`: Text
   - `last_comment_at`: Timestamp

### Database Functions

1. **upsert_circle_issue**
   - Creates or updates a record in the circle_issues table

2. **determine_segment**
   - Determines the appropriate segment for an issue based on its content

3. **format_circle_message_description**
   - Formats Circle.so messages for display, including thread handling

4. **cleanup_legacy_test_data**
   - Removes test data older than specified threshold

### Entity Relationships

```
issues
 ├── 1:N → comments
 ├── 1:N → issue_status_logs
 ├── 1:N → issue_tags
 └── 1:1 ← circle_issues (via mapped_to_issue_id)

circle_issues
 ├── 1:N → issue_import_logs
 └── 0:1 → issues (via mapped_to_issue_id)

circle_spaces
 └── Referenced by circle_issues (via chat_room_uuid lookup)

tags
 └── 1:N → issue_tags
```

## Non-Technical Explanation: Our Data Journey

### The Big Picture

Our system bridges the gap between community conversations in Circle.so and structured issue tracking. We help AI community members report issues or ask for help more easily by converting their messages and discussions into trackable issues that can be assigned, monitored, and resolved.

Think of it as transforming casual conversations about problems into organized to-do items that never get lost or forgotten. This ensures that every question, bug report, or feature request from the community gets the attention it deserves.

### Main Building Blocks

Our system has several key components that work together:

**1. Messages from Circle.so**
These are the starting point - conversations happening in the community that might contain issues, questions, or requests.

**2. Issues**
The heart of our tracking system - structured records of problems that need solving or questions that need answering. Each issue has important properties like who reported it, what it's about, and its current status.

**3. Comments**
Ongoing conversations about an issue as it's being worked on. Comments help keep everything about a specific issue in one place.

**4. Spaces**
Different areas in the Circle.so community (like "General chat" or "Help requests") where conversations happen.

**5. Categories (Segments)**
We organize issues into four main categories:
- **Auth**: Login, account, or authentication issues
- **Code**: Programming bugs or errors
- **Tool**: Questions about tools or workflows
- **Misc**: Everything else that doesn't fit the above

### How The Parts Work Together

1. **From Chat to Issue**
   - Someone posts a message in Circle.so
   - Our system identifies it as an issue that needs tracking
   - The message is saved as a "circle_issue" in our database
   - A corresponding "issue" is created in the tracker

2. **Issue Lifecycle**
   - New issues start as "waiting_for_help" or "in_progress"
   - Team members add comments and work on solutions
   - Issues move to "resolved" when fixed
   - Issues can be "archived" to keep the main view clean

3. **Conversations to Structured Data**
   - Thread messages with replies are formatted to preserve the conversation
   - We keep track of which Circle.so space each message came from
   - We maintain the connection between the original message and the issue

### How We Organize

Our system uses several organizing principles:

**Status Labels**
- **Waiting for Help**: Issues that need attention
- **In Progress**: Someone is actively working on this
- **Resolved**: The issue has been fixed or answered
- **Blocked**: Progress is stalled for some reason
- **Archived**: Handled issues that are kept for reference

**Categories (Segments)**
We automatically categorize issues based on their content:
- **Auth**: Login and account issues
- **Code**: Programming and error issues
- **Tool**: Questions about tools and utilities
- **Misc**: Everything else

**Tracking Over Time**
We keep detailed records of:
- When issues were created
- Who's working on them
- Status changes and when they happened
- All comments and updates

### The Flow: From Conversation to Resolution

1. **Capture**: Message from Circle.so is identified as an issue
2. **Transform**: Formatted and categorized as a trackable issue
3. **Track**: Team manages the issue through its lifecycle
4. **Resolve**: Solution is provided and issue is marked resolved
5. **Learn**: Data about types of issues helps improve products

### Benefits for Different Team Members

**For Community Managers**:
- See which community spaces generate the most issues
- Track how quickly issues are being resolved
- Identify common questions that might need documentation

**For Developers**:
- Prioritize bugs based on status and age
- Track your progress on assigned issues
- See related conversations for context

**For Product Managers**:
- Identify trends in user difficulties
- Gather insights for product improvements
- Measure resolution times and team performance

### Current Status and Next Steps

We've completed the core pipeline connecting Circle.so to our issue tracker. The system can:
1. Import messages from Circle.so
2. Convert them to structured issues
3. Track their progress through resolution
4. Maintain the relationship between messages and issues

Next steps include:
1. Automating the import process with scheduled jobs
2. Adding notifications for new issues
3. Implementing deeper analytics on issue patterns
4. Exploring two-way sync to update Circle.so when issues are resolved

---

With this system, we ensure that valuable feedback and questions from the community are never lost and always receive the attention they deserve - transforming casual conversations into actionable insights and resolved issues. 