# Comprehensive LLM Prompt for Issue Tracker Enhancements

## Task: Add Zero-Password Profile Selector & Activity Logging to Bug Tracker

You are enhancing an existing bug tracking application built with React, TypeScript, and Supabase. This application already has issue tracking, commenting, status management, and filtering capabilities fully implemented. Your task is to add a profile selector and activity logging without disrupting the existing design patterns and UI/UX.

## CURRENT SYSTEM OVERVIEW

The application is built with:
- React + TypeScript + Vite
- TailwindCSS for styling
- ShadCN UI components (based on RadixUI)
- Supabase for backend (already configured)
- React Query for data fetching/mutations

Key existing features:
- Issue listing with filtering (segment, status, search)
- Card & Grid view layouts
- Status workflow (pending → in_progress → blocked → resolved)
- Issue creation form with tags and reporter name
- Comment system on issues
- Basic analytics/charts

Database schema already includes:
- `issues`: Main issue table with title, description, status, segment, etc.
- `comments`: Comments on issues with author_name
- `issue_status_logs`: Logs of status changes
- `tags` and `issue_tags`: Tag management

The Supabase client is already set up with proper typing and ready to use:
```typescript
import { supabase } from "@/integrations/supabase/client";
```

## NEW REQUIREMENT 1: PROFILE SELECTOR

### Functionality
1. **Entry Modal**
   - On first app load, show a modal with three profile options:
     - Jason (Product)
     - Jaye (Marketing)
     - Kai (Engineering)
   - Each profile should be represented by a circular avatar button
   - Modal should prevent interaction with the app until a profile is selected

2. **Profile Storage**
   - Store selected profile in localStorage to persist across page reloads
   - Also store in Supabase `user_sessions` table for logging purposes

3. **Profile Indicator**
   - After selection, display a small profile indicator in the header
   - Include a "Switch" option to re-open the modal and change profiles

4. **Auto-filling**
   - New Issue form: Auto-fill "Your Name" field with active profile name
   - Comments: Auto-fill "Your name" field with active profile name

### Design Requirements
- Follow the existing design system and component patterns
- Avatar styling should match the existing avatar components
- Modal should use the existing Dialog component
- Animations and transitions should be consistent with the rest of the app

## NEW REQUIREMENT 2: ACTIVITY LOGGING

### Supabase View Creation
Create a new view in Supabase called "issue_activity_log" that will:

1. Join data from:
   - `issues` table (title, segment, status, timestamps)
   - `user_sessions` table (profile selected)
   - `issue_status_logs` table (who changed what and when)

2. Include these columns:
   - Issue Title
   - Segment
   - Status
   - Assigned To
   - Resolved By
   - Resolved At
   - Last Commenter
   - Last Comment At

### Front-end Integration
1. When status is changed to "resolved":
   - Update issue status
   - Set `assigned_to = current_profile` 
   - Record `resolved_by` and `resolved_at` fields
   - Ensure these values are included in status logs

2. For comments:
   - Automatically associate the active profile
   - Update "Last Commenter" and "Last Comment At" fields

## IMPLEMENTATION STEPS

### Step 1: Create User Sessions Table in Supabase
```sql
-- This is pseudo-SQL to explain the structure
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_name TEXT NOT NULL, -- 'Jason', 'Jaye', or 'Kai'
  profile_role TEXT NOT NULL, -- 'Product', 'Marketing', or 'Engineering'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any necessary indexes
```

### Step 2: Create ProfileSelector Component
Create a new component for the profile selection modal that integrates with the existing UI:

1. Create `src/components/ProfileSelector.tsx`
2. Create `src/components/ProfileIndicator.tsx` for the header display
3. Add the profile management logic using:
   - Context API for state management
   - localStorage for persistence
   - Supabase for session logging

### Step 3: Modify Issue Status Handling
Update the status update function to include the active profile:

1. Modify `updateIssueStatus` in `issueService.ts`
2. Add new fields to track who resolved the issue and when
3. Update status log entries to include the active profile

### Step 4: Create Supabase View for Activity Logging
Create a SQL view that joins the necessary tables:

```sql
-- This is pseudo-SQL to illustrate the concept
CREATE VIEW issue_activity_log AS
SELECT
  i.title AS issue_title,
  i.segment,
  i.status,
  i.assigned_to,
  -- Logic to determine resolver based on status logs
  (SELECT s.profile_name FROM issue_status_logs isl
   JOIN user_sessions s ON isl.changed_by = s.profile_name
   WHERE isl.issue_id = i.id AND isl.new_status = 'solved'
   ORDER BY isl.changed_at DESC LIMIT 1) AS resolved_by,
  -- Logic to get resolved timestamp
  (SELECT isl.changed_at FROM issue_status_logs isl
   WHERE isl.issue_id = i.id AND isl.new_status = 'solved'
   ORDER BY isl.changed_at DESC LIMIT 1) AS resolved_at,
  -- Logic to get last commenter
  (SELECT c.author_name FROM comments c
   WHERE c.issue_id = i.id
   ORDER BY c.created_at DESC LIMIT 1) AS last_commenter,
  -- Logic to get last comment timestamp
  (SELECT c.created_at FROM comments c
   WHERE c.issue_id = i.id
   ORDER BY c.created_at DESC LIMIT 1) AS last_comment_at
FROM
  issues i
```

### Step 5: Integrate Profile Data with Forms
1. Update `NewIssueDialog.tsx` to pre-fill the submitter name
2. Update `CommentSection.tsx` to pre-fill the author name

## IMPLEMENTATION DETAILS

### ProfileContext.tsx
```typescript
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define the profile structure
export interface Profile {
  name: string;
  role: string;
  avatarSeed: string;
}

// Preset profiles
export const PROFILES: Profile[] = [
  { name: 'Jason', role: 'Product', avatarSeed: 'jason-product' },
  { name: 'Jaye', role: 'Marketing', avatarSeed: 'jaye-marketing' },
  { name: 'Kai', role: 'Engineering', avatarSeed: 'kai-engineering' }
];

// Context type
interface ProfileContextType {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  showProfileSelector: boolean;
  setShowProfileSelector: (show: boolean) => void;
}

// Create context
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component
export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState<boolean>(false);
  
  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('activeProfile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile) as Profile;
        setActiveProfileState(profile);
      } catch (e) {
        console.error('Failed to parse saved profile', e);
        setShowProfileSelector(true);
      }
    } else {
      // No saved profile, show selector
      setShowProfileSelector(true);
    }
  }, []);

  // Handle setting active profile
  const setActiveProfile = async (profile: Profile) => {
    // Save to localStorage
    localStorage.setItem('activeProfile', JSON.stringify(profile));
    
    // Save to Supabase (for logging)
    try {
      await supabase.from('user_sessions').insert({
        profile_name: profile.name,
        profile_role: profile.role
      });
    } catch (error) {
      console.error('Failed to save profile to Supabase', error);
    }
    
    // Update state
    setActiveProfileState(profile);
    setShowProfileSelector(false);
  };

  return (
    <ProfileContext.Provider value={{
      activeProfile,
      setActiveProfile,
      showProfileSelector,
      setShowProfileSelector
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

// Custom hook for using profile context
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
```

### ProfileSelector.tsx
```typescript
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile, PROFILES } from './ProfileContext';

const ProfileSelector: React.FC = () => {
  const { showProfileSelector, setActiveProfile } = useProfile();
  
  const handleSelectProfile = (profile: typeof PROFILES[0]) => {
    setActiveProfile(profile);
  };
  
  return (
    <Dialog open={showProfileSelector} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-4">
          <h2 className="text-xl font-bold">Select Your Profile</h2>
          <p className="text-secondary-light">Choose which team member you are</p>
          
          <div className="flex justify-center gap-8 mt-6">
            {PROFILES.map(profile => (
              <div 
                key={profile.name} 
                className="flex flex-col items-center space-y-2 cursor-pointer"
                onClick={() => handleSelectProfile(profile)}
              >
                <Avatar className="h-16 w-16 hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed}`} 
                    alt={profile.name} 
                  />
                  <AvatarFallback>{profile.name[0]}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <div className="font-medium">{profile.name}</div>
                  <div className="text-xs text-secondary-light">{profile.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSelector;
```

### ProfileIndicator.tsx
```typescript
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useProfile } from './ProfileContext';

const ProfileIndicator: React.FC = () => {
  const { activeProfile, setShowProfileSelector } = useProfile();
  
  if (!activeProfile) return null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeProfile.avatarSeed}`} 
              alt={activeProfile.name} 
            />
            <AvatarFallback>{activeProfile.name[0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{activeProfile.name}</p>
            <p className="text-xs text-secondary-light">{activeProfile.role}</p>
          </div>
        </div>
        <DropdownMenuItem onClick={() => setShowProfileSelector(true)}>
          Switch profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileIndicator;
```

### Update App.tsx
```typescript
import { ProfileProvider } from '@/components/ProfileContext';
import ProfileSelector from '@/components/ProfileSelector';
// existing imports...

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ProfileProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ProfileSelector />
        <BrowserRouter>
          {/* Add ProfileIndicator to layout header */}
          <header className="border-b py-4 px-6 flex justify-between items-center">
            <h1 className="text-xl font-bold">Issue Tracker</h1>
            <ProfileIndicator />
          </header>
          <Routes>
            {/* existing routes */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ProfileProvider>
  </QueryClientProvider>
);
```

### Update NewIssueDialog.tsx
```typescript
// Add to imports
import { useProfile } from './ProfileContext';

const NewIssueDialog: React.FC<NewIssueDialogProps> = ({ open, onOpenChange, onSubmit }) => {
  const { activeProfile } = useProfile();
  // existing code...
  
  const { register, handleSubmit, reset, formState: { errors, isValid }, setValue } = useForm<NewIssueFormData>({
    defaultValues: {
      title: '',
      description: '',
      submitted_by: activeProfile?.name || '',  // Pre-fill with active profile
      email: '',
      tags: '',
    },
  });
  
  // Set submitted_by when activeProfile changes
  useEffect(() => {
    if (activeProfile) {
      setValue('submitted_by', activeProfile.name);
    }
  }, [activeProfile, setValue]);
  
  // rest of existing component...
};
```

### Update CommentSection.tsx
```typescript
// Add to imports
import { useProfile } from './ProfileContext';

const CommentSection: React.FC<CommentSectionProps> = ({ issueId }) => {
  const { activeProfile } = useProfile();
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState(activeProfile?.name || 'Community Manager');
  // existing code...
  
  // Update authorName when activeProfile changes
  useEffect(() => {
    if (activeProfile) {
      setAuthorName(activeProfile.name);
    }
  }, [activeProfile]);
  
  // rest of existing component...
};
```

### Update updateIssueStatus in issueService.ts
```typescript
export const updateIssueStatus = async (id: string, status: string, profileName: string = 'System') => {
  // First get the current status
  const { data: issue, error: fetchError } = await supabase
    .from('issues')
    .select('status')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    toast.error('Failed to fetch current issue status');
    throw fetchError;
  }
  
  const oldStatus = issue.status;
  let updateData: any = { status };
  
  // If status is changing to 'solved', record resolver info
  if (status === 'solved' && oldStatus !== 'solved') {
    updateData = { 
      ...updateData,
      assigned_to: profileName,
      resolved_by: profileName,
      resolved_at: new Date().toISOString()
    };
  }

  // Update the issue
  const { data, error } = await supabase
    .from('issues')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    toast.error('Failed to update issue status');
    throw error;
  }
  
  // Log the status change
  await supabase.from('issue_status_logs').insert({
    issue_id: id,
    old_status: oldStatus,
    new_status: status,
    changed_by: profileName
  });
  
  toast.success(`Issue status updated to ${status}`);
  return data as Issue;
};
```

### Create SQL View for Activity Log
```sql
CREATE OR REPLACE VIEW issue_activity_log AS
SELECT
  i.id,
  i.title as issue_title,
  i.segment,
  i.status,
  i.assigned_to,
  -- For resolved_by, get the user who changed status to 'solved'
  (
    SELECT isl.changed_by
    FROM issue_status_logs isl
    WHERE isl.issue_id = i.id AND isl.new_status = 'solved'
    ORDER BY isl.changed_at DESC
    LIMIT 1
  ) as resolved_by,
  -- For resolved_at, get the timestamp when status changed to 'solved'
  (
    SELECT isl.changed_at
    FROM issue_status_logs isl
    WHERE isl.issue_id = i.id AND isl.new_status = 'solved'
    ORDER BY isl.changed_at DESC
    LIMIT 1
  ) as resolved_at,
  -- Get the most recent commenter
  (
    SELECT c.author_name
    FROM comments c
    WHERE c.issue_id = i.id
    ORDER BY c.created_at DESC
    LIMIT 1
  ) as last_commenter,
  -- Get the most recent comment timestamp
  (
    SELECT c.created_at
    FROM comments c
    WHERE c.issue_id = i.id
    ORDER BY c.created_at DESC
    LIMIT 1
  ) as last_comment_at
FROM
  issues i;
```

## TESTING INSTRUCTIONS

1. Run the application and verify the profile selector appears on first load
2. Test selecting each profile and confirm it persists across page reloads
3. Create new issues and verify the submitter name is auto-filled
4. Add comments and confirm the author name is pre-filled
5. Change issue statuses and verify the activity log in Supabase records the correct information
6. Test the "Switch profile" functionality
7. Verify that the activity log view contains the expected data

## NON-GOALS (For clarity)
- No authentication or security measures required
- No role-based access control needed (all users see everything)
- No need to modify existing UI styling beyond adding the new components
- No integrations with external notification systems 