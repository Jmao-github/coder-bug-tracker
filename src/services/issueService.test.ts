import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { updateIssueStatus, fetchIssues, fetchIssuesBySegment } from './issueService';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  }
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('Issue Service - Archive Functionality', () => {
  const mockIssue = {
    id: '123',
    title: 'Test Issue',
    status: 'in_progress',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  const mockIssueList = [
    { id: '1', title: 'Issue 1', status: 'in_progress' },
    { id: '2', title: 'Issue 2', status: 'archived', archived_at: '2023-01-01T00:00:00.000Z' },
    { id: '3', title: 'Issue 3', status: 'resolved' }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set archived_at timestamp when changing status to archived', async () => {
    // Mock the response from Supabase
    const mockFrom = vi.fn().mockReturnThis();
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockReturn = { error: null };

    vi.spyOn(global, 'Date').mockImplementation(() => new Date('2023-01-02T00:00:00.000Z'));

    // Mock the chain of Supabase calls
    const supabase = {
      from: mockFrom,
      update: mockUpdate,
      eq: mockEq
    };

    // Override the mock for this specific test
    vi.mocked(supabase.from).mockReturnValue({
      ...supabase,
      update: mockUpdate.mockReturnValue({
        ...supabase,
        eq: mockEq.mockReturnValue(mockReturn)
      })
    });

    // Call the function with test parameters
    await updateIssueStatus('123', 'archived', 'Test User');

    // Verify update was called with archived_at timestamp
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'archived',
      archived_at: expect.any(String)
    }));
  });

  it('should exclude archived issues by default in fetchIssues', async () => {
    // Mock the response for fetchIssues
    const mockSelect = vi.fn().mockReturnThis();
    const mockNeq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockReturn = { data: mockIssueList.filter(i => i.status !== 'archived'), error: null };

    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: mockSelect,
      neq: mockNeq,
      order: mockOrder
    };

    // Override the mock for this specific test
    vi.mocked(supabase.from).mockReturnValue({
      ...supabase,
      select: mockSelect.mockReturnValue({
        ...supabase,
        neq: mockNeq.mockReturnValue({
          ...supabase,
          order: mockOrder.mockReturnValue(mockReturn)
        })
      })
    });

    // Call the function with default parameters
    const result = await fetchIssues();

    // Verify neq was called to exclude archived issues
    expect(mockNeq).toHaveBeenCalledWith('status', 'archived');
    
    // Verify only non-archived issues are returned
    expect(result.length).toBe(2);
    expect(result.some(issue => issue.status === 'archived')).toBe(false);
  });

  it('should include archived issues when includeArchived is true', async () => {
    // Mock the response for fetchIssues with includeArchived
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockReturn = { data: mockIssueList, error: null };

    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: mockSelect,
      order: mockOrder
    };

    // Override the mock for this specific test
    vi.mocked(supabase.from).mockReturnValue({
      ...supabase,
      select: mockSelect.mockReturnValue({
        ...supabase,
        order: mockOrder.mockReturnValue(mockReturn)
      })
    });

    // Call the function with includeArchived set to true
    const result = await fetchIssues(true);

    // Verify all issues are returned including archived
    expect(result.length).toBe(3);
    expect(result.some(issue => issue.status === 'archived')).toBe(true);
  });
}); 