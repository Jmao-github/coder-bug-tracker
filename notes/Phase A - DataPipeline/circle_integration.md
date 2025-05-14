# Circle.so Integration Documentation

## Overview
This document outlines the implementation details for integrating Circle.so community messages into the bug tracker system. The integration allows for automated issue creation from Circle.so messages and threads, properly formatted for display in the bug tracker UI.

## Integration Flow
1. **Data Collection**: n8n workflow retrieves messages from Circle.so API
2. **Triage**: Claude 3.7 in n8n workflow identifies actionable issues
3. **Data Storage**: Processed messages are stored in Supabase `circle_issues` table
4. **Issue Mapping**: Circle messages are converted to bug tracker issues
5. **Display**: Issues appear in the dashboard with proper formatting

## Database Schema

### circle_issues Table
```sql
CREATE TABLE IF NOT EXISTS circle_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT UNIQUE NOT NULL,
  thread_id TEXT,
  title TEXT NOT NULL,
  body TEXT,
  author_name TEXT,
  author_email TEXT,
  space_name TEXT,
  space_id TEXT,
  link TEXT,
  is_thread BOOLEAN DEFAULT false,
  is_triaged BOOLEAN DEFAULT false,
  triage_confidence FLOAT,
  raw_data JSONB,
  mapped_to_issue_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### circle_spaces Table
```sql
CREATE TABLE IF NOT EXISTS circle_spaces (
  id SERIAL PRIMARY KEY,
  space_id BIGINT NOT NULL,
  space_name TEXT NOT NULL,
  chat_room_uuid TEXT NOT NULL UNIQUE,
  space_member_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### issue_import_logs Table
```sql
CREATE TABLE IF NOT EXISTS issue_import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_issue_id UUID REFERENCES circle_issues(id),
  issue_id UUID REFERENCES issues(id),
  imported_by TEXT,
  import_source TEXT,
  import_notes TEXT,
  is_automatic BOOLEAN DEFAULT false,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Formatting Rules

### Title Generation
- For single messages:
  - First sentence or first 10-12 words of body (trim punctuation)
- For thread messages:
  - First 10-12 words of parent_body
- Limits:
  - Cut at sentence-ending punctuation if possible (., ?, !)
  - Avoid trailing ellipsis (...)

### Description Formatting
- For single messages:
  - Full message body preserving hashtags, mentions, and emojis
- For thread messages:
  - Parent body + replies formatted as Markdown quotes
  - Format: `> **Reply by {author}**: {reply_body}`
- Attachments:
  - Append attachment URLs on new lines
- Footer:
  - Space name from lookup table
  - `*Imported from Circle #{message_id}*`
  - ISO timestamp of original creation date

## SQL Functions

### format_circle_message_description
This function handles the complex formatting of Circle.so messages, including:
- Thread vs. single message detection
- Reply formatting
- Attachment handling
- Space name lookup
- Footer generation

```sql
CREATE OR REPLACE FUNCTION format_circle_message_description(data jsonb)
RETURNS text AS $$
-- Function implementation
$$ LANGUAGE plpgsql;
```

### cleanup_legacy_test_data
Function to clean up test data, with cascading deletion to maintain referential integrity:

```sql
CREATE OR REPLACE FUNCTION cleanup_legacy_test_data()
RETURNS SETOF TEXT AS $$
-- Function implementation
$$ LANGUAGE plpgsql;
```

## Frontend Enhancements

### Null Safety
Added null handling throughout the frontend components:
- IssueCard component checks for null descriptions
- Default empty string/values provided for all nullable fields
- Error boundary handling for malformed data

### Testing Process
1. Create test Circle.so messages in Supabase
2. Map to issues with proper formatting
3. Verify display in frontend
4. Test comment functionality
5. Verify proper error handling for edge cases

## Maintenance Procedures

### Data Cleanup
Run the cleanup_legacy_test_data() function to remove test data older than 1 day:

```sql
SELECT * FROM cleanup_legacy_test_data();
```

### Comment Verification
Check comments from specific users:

```sql
SELECT 
  c.id, 
  c.issue_id, 
  c.author_name, 
  c.body, 
  c.created_at,
  i.title as issue_title
FROM comments c
JOIN issues i ON c.issue_id = i.id
WHERE c.author_name LIKE 'Jaye%'
ORDER BY c.created_at DESC;
```

## Next Steps
1. Automate Circle.so data import with scheduled n8n workflow
2. Implement notification system for new issues from Circle.so
3. Add two-way sync capabilities when Circle.so API supports it
4. Enhance analytics to track source of issues (Circle vs. direct) 