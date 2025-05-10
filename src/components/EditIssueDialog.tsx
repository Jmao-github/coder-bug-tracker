import React, { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import { updateIssue } from '@/services/issueService';
import { Issue } from '@/types/issueTypes';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface EditIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: Partial<Issue> | null;
  onSubmit: () => void;
}

const STATUS_OPTIONS = [
  { value: 'waiting_for_help', label: 'Waiting for Help' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
];

const EditIssueDialog: React.FC<EditIssueDialogProps> = ({ open, onOpenChange, issue, onSubmit }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isValid } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      status: 'in_progress',
    },
  });

  useEffect(() => {
    if (open && issue) {
      setValue('title', issue.title);
      setValue('description', issue.description);
      setValue('status', issue.status);
    } else if (!open) {
      reset();
    }
  }, [open, issue, setValue, reset]);

  const mutation = useMutation({
    mutationFn: (data: { title: string; description: string; status: string }) =>
      updateIssue(issue!.id, { ...data, status: data.status as Issue['status'] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue-counts'] });
      queryClient.invalidateQueries({ queryKey: ['status-counts'] });
      toast.success('Issue updated successfully');
      onOpenChange(false);
      onSubmit();
    },
    onError: (error) => {
      toast.error('Failed to update issue');
    },
  });

  const submitForm = (data: { title: string; description: string; status: string }) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Issue</DialogTitle>
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
            {errors.title && <p className="text-xs text-red-500">Title is required</p>}
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
            {errors.description && <p className="text-xs text-red-500">Description is required</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={val => setValue('status', val)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !isValid}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditIssueDialog; 