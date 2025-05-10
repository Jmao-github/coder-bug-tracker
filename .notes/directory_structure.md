# Directory Structure

```
.
├── .notes                      # Project documentation and notes
├── public                      # Static assets
├── src                         # Source code
│   ├── components              # React components
│   │   └── ui                  # UI/design system components
│   ├── hooks                   # Custom React hooks
│   ├── integrations            # External service integrations
│   │   └── supabase            # Supabase integration files
│   ├── lib                     # Utility functions and helpers
│   ├── pages                   # Page components (routing)
│   ├── services                # API and service modules
│   └── types                   # TypeScript type definitions
├── supabase                    # Supabase configuration files
├── .cursorrules                # Cursor rules for project
├── index.html                  # HTML entry point
├── package.json                # NPM dependencies and scripts
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```

## Key Directories

### `.notes/`
Contains all project documentation, task lists, and meeting notes.

### `src/components/`
React components organized by function. UI components are separated into `ui/` subdirectory.

### `src/integrations/supabase/`
Contains Supabase client configuration and database types.

### `src/pages/`
Main page components that serve as route endpoints.

### `src/services/`
API service modules for backend communication.

### `src/types/`
TypeScript type definitions for the application.

## File Placement Guidelines

1. **New React Components**: Place in `src/components/` with appropriate naming
   - Shared UI components: `src/components/ui/`
   - Feature-specific components: `src/components/`

2. **API Services**: Place in `src/services/` grouped by functionality

3. **Type Definitions**: Place in `src/types/` with descriptive names

4. **Utilities and Helpers**: Place in `src/lib/`

5. **New Pages**: Place in `src/pages/` with corresponding route setup 