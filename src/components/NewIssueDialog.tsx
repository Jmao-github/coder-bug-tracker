import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useForm } from 'react-hook-form';
import { createIssue } from '@/services/issueService';
import { NewIssue } from '@/types/issueTypes';
import { useProfile } from './ProfileContext';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Tag, FileCode, Code, HelpCircle, ChevronDown, ChevronUp, User } from "lucide-react";

interface NewIssueFormData {
  title: string;
  description: string;
  category: string;
  affectedUserName?: string;
  affectedUserEmail?: string;
}

interface NewIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  defaultCategory?: string; // Active tab category
}

// Issue category definitions
const CATEGORIES = [
  { id: 'auth', name: 'Auth & Login', icon: Tag, color: 'text-purple-500' },
  { id: 'code', name: 'Code Generation', icon: FileCode, color: 'text-blue-500' },
  { id: 'tool', name: 'Tool', icon: Code, color: 'text-green-500' },
  { id: 'misc', name: 'Other', icon: HelpCircle, color: 'text-gray-500' }
];

// Map category ID to related tags
const CATEGORY_TAGS = {
  'auth': ['#auth', '#login', '#authentication'],
  'code': ['#code-generation', '#ai-code'],
  'tool': ['#tool', '#productivity'],
  'misc': ['#misc', '#other']
};

// Standardized segment mapping to ensure consistent database storage
const SEGMENT_MAPPING = {
  'auth': 'auth',
  'code': 'code', 
  'tool': 'tool', // Tool issues now use their own segment
  'misc': 'misc'
};

const NewIssueDialog: React.FC<NewIssueDialogProps> = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  defaultCategory = '' 
}) => {
  const { activeProfile } = useProfile();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAffectedUser, setShowAffectedUser] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    watch, 
    formState: { errors, isValid } 
  } = useForm<NewIssueFormData>({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      affectedUserName: '',
      affectedUserEmail: '',
    },
  });
  
  const currentCategory = watch('category');
  const affectedUserEmail = watch('affectedUserEmail');
  
  // Set category when dialog opens or defaultCategory changes
  useEffect(() => {
    if (open && defaultCategory) {
      setValue('category', defaultCategory);
      setSelectedCategory(defaultCategory);
    }
  }, [open, defaultCategory, setValue]);
  
  const queryClient = useQueryClient();

  // Mutation to create a new issue
  const issueMutation = useMutation({
    mutationFn: (issue: NewIssue) => createIssue(issue),
  });

  const submitForm = (data: NewIssueFormData) => {
    if (!data.category || !activeProfile) {
      // Show error message if category is missing or profile not loaded
      if (!data.category) {
        toast.error('Please select a category for the issue');
      }
      if (!activeProfile) {
        toast.error('Profile information is missing. Please select a profile first.');
      }
      return;
    }

    try {
      // Get tags for the selected category
      const categoryTags = CATEGORY_TAGS[data.category as keyof typeof CATEGORY_TAGS] || ['#misc'];
      
      // Map the category to the correct segment using standardized mapping
      const segment = SEGMENT_MAPPING[data.category as keyof typeof SEGMENT_MAPPING];
      
      console.log(`Creating new issue with category: ${data.category}, segment: ${segment}, tags: ${categoryTags.join(', ')}`);
      
      // Create the new issue payload
      const newIssue: NewIssue = {
        title: data.title,
        description: data.description,
        submitted_by: activeProfile.name,
        assigned_to: null,
        tags: categoryTags,
        status: 'pending',
        segment: segment as 'auth' | 'code' | 'misc'
      };

      // Add affected user info if provided
      if (showAffectedUser) {
        if (data.affectedUserName) {
          newIssue.affected_user_name = data.affectedUserName;
        }
        if (data.affectedUserEmail) {
          newIssue.affected_user_email = data.affectedUserEmail;
        }
      }

      // Show submitting toast
      const toastId = toast.loading('Submitting issue...');
      
      // Submit the issue
      issueMutation.mutate(newIssue, {
        onSuccess: () => {
          toast.dismiss(toastId);
          toast.success('Issue created successfully');
          // Refresh issues list to show the new issue
          queryClient.invalidateQueries({ queryKey: ['issues'] });
          // Also invalidate segment-specific queries
          if (segment) {
            queryClient.invalidateQueries({ queryKey: ['issues', segment] });
          }
          // Invalidate the direct counts query
          queryClient.invalidateQueries({ queryKey: ['issue-counts'] });
          
          console.log('Successfully invalidated all relevant issue queries');
          reset();
          setSelectedCategory('');
          setShowAffectedUser(false);
          onOpenChange(false);
          onSubmit(newIssue);
        },
        onError: (error) => {
          toast.dismiss(toastId);
          toast.error(`Failed to create issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error('Error creating issue:', error);
        }
      });
    } catch (error) {
      // Handle any unexpected errors
      console.error('Error preparing issue submission:', error);
      toast.error('Failed to prepare issue submission');
    }
  };

  const handleCategoryChange = (value: string) => {
    setValue('category', value);
    setSelectedCategory(value);
  };

  const resetForm = () => {
    reset();
    setSelectedCategory('');
    setShowAffectedUser(false);
    onOpenChange(false);
  };

  // Email validation function
  const isValidEmail = (email: string) => {
    return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      else onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title"
              placeholder="Issue title"
              {...register('title', { required: true })}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-xs text-red-500">Title is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              placeholder="Detailed description of the issue"
              rows={5}
              {...register('description', { required: true })}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-xs text-red-500">Description is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Issue Category</Label>
            <Select 
              value={selectedCategory} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger 
                id="category"
                className={!selectedCategory ? 'text-muted-foreground border-red-500' : ''}
              >
                <SelectValue placeholder="Select issue category..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category.id} value={category.id} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <category.icon className={`h-4 w-4 ${category.color}`} />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedCategory && (
              <p className="text-xs text-red-500">Category selection is required</p>
            )}
          </div>

          {/* Reporter info - automatically using profile */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm text-secondary-light">
              <User className="h-4 w-4" />
              <span>Reporting as: <span className="font-medium text-secondary">{activeProfile?.name}</span></span>
            </div>
          </div>

          {/* Collapsible Affected User section */}
          <Collapsible
            open={showAffectedUser}
            onOpenChange={setShowAffectedUser}
            className="border rounded-md p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium">Affected User Details</h4>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  {showAffectedUser ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="affectedUserName">Affected User Name</Label>
                <Input 
                  id="affectedUserName"
                  placeholder="Name of affected user"
                  {...register('affectedUserName')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="affectedUserEmail">Affected User Email</Label>
                <Input 
                  id="affectedUserEmail"
                  placeholder="email@example.com"
                  type="email"
                  {...register('affectedUserEmail', {
                    validate: (value) => isValidEmail(value) || 'Please enter a valid email'
                  })}
                  className={errors.affectedUserEmail ? 'border-red-500' : ''}
                />
                {errors.affectedUserEmail && (
                  <p className="text-xs text-red-500">{errors.affectedUserEmail.message}</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              disabled={issueMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={issueMutation.isPending || !selectedCategory || !isValid}
            >
              {issueMutation.isPending ? 'Submitting...' : 'Submit Issue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewIssueDialog;
