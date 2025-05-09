
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';

interface NewIssueFormData {
  title: string;
  description: string;
  reporter: {
    name: string;
    email?: string;
  };
  tags: string;
}

interface NewIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    reporter: {
      name: string;
      email?: string;
    };
    tags: string[];
  }) => void;
}

const NewIssueDialog: React.FC<NewIssueDialogProps> = ({ open, onOpenChange, onSubmit }) => {
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<NewIssueFormData>({
    defaultValues: {
      title: '',
      description: '',
      reporter: {
        name: '',
        email: '',
      },
      tags: '',
    },
  });

  const submitForm = (data: NewIssueFormData) => {
    // Convert comma-separated tags to array and ensure # prefix
    const formattedTags = data.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

    onSubmit({
      title: data.title,
      description: data.description,
      reporter: data.reporter,
      tags: formattedTags
    });

    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reporter-name">Your Name</Label>
              <Input 
                id="reporter-name"
                placeholder="Your name"
                {...register('reporter.name', { required: true })}
                className={errors.reporter?.name ? 'border-red-500' : ''}
              />
              {errors.reporter?.name && (
                <p className="text-xs text-red-500">Name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reporter-email">Your Email (optional)</Label>
              <Input 
                id="reporter-email"
                placeholder="your.email@example.com"
                type="email"
                {...register('reporter.email')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input 
              id="tags"
              placeholder="e.g. #login-issue, #email, #backend"
              {...register('tags', { required: true })}
              className={errors.tags ? 'border-red-500' : ''}
            />
            {errors.tags && (
              <p className="text-xs text-red-500">At least one tag is required</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Submit Issue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewIssueDialog;
