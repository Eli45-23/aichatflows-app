import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { FormSubmission, Submission } from '../types';

const debugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

const debugLog = (message: string, data?: any) => {
  if (debugMode) {
    console.log(`[Onboarding Hook] ${message}`, data || '');
  }
};

interface OnboardingSubmissionsHookState {
  submissions: FormSubmission[];
  loading: boolean;
  error: string | null;
}

export function useFormSubmissions() {
  const [state, setState] = useState<OnboardingSubmissionsHookState>({
    submissions: [],
    loading: true,
    error: null,
  });

  const { submissions, loading, error } = state;

  const updateState = (updates: Partial<OnboardingSubmissionsHookState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Fetch all onboarding submissions from new schema
  const fetchSubmissions = async (showLoading = true) => {
    try {
      if (showLoading) updateState({ loading: true, error: null });
      debugLog('Fetching onboarding submissions from new schema...');

      const { data, error } = await supabase
        .from('form_submissions')
        .select(`
          id,
          email,
          status,
          client_id,
          submitted_at,
          client:clients(
            id,
            name,
            email,
            phone,
            status
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        debugLog('Error fetching submissions:', error);
        throw error;
      }

      debugLog('Submissions fetched successfully from new schema:', data?.length);
      updateState({ submissions: (data as unknown as FormSubmission[]) || [], loading: false });
      return data || [];
    } catch (error: any) {
      debugLog('Exception fetching submissions:', error);
      const errorMessage = error.message;
      updateState({ error: errorMessage, loading: false });
      if (showLoading) {
        Alert.alert('Error', `Failed to load onboarding submissions: ${errorMessage}`);
      }
      throw error;
    }
  };

  // Get submission by ID
  const getSubmissionById = (id: string) => {
    return submissions.find(submission => submission.id === id);
  };

  // Create new form submission
  const createSubmission = async (submissionData: Omit<FormSubmission, 'id' | 'submitted_at'>) => {
    try {
      debugLog('Creating onboarding submission in new schema...', submissionData);

      // Validate required fields
      if (!submissionData.client_id || !submissionData.email) {
        throw new Error('Client ID and email are required');
      }

      // Verify client exists
      const { data: clientExists } = await supabase
        .from('clients')
        .select('id')
        .eq('id', submissionData.client_id)
        .single();

      if (!clientExists) {
        throw new Error('Client not found');
      }

      // Prepare submission data
      const newSubmissionData = {
        client_id: submissionData.client_id,
        email: submissionData.email.trim().toLowerCase(),
        status: submissionData.status || 'pending',
        submitted_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('form_submissions')
        .insert([newSubmissionData])
        .select(`
          id,
          email,
          status,
          client_id,
          submitted_at,
          client:clients(
            id,
            name,
            email,
            phone,
            status
          )
        `)
        .single();

      if (error) {
        debugLog('Error creating submission:', error);
        throw error;
      }

      debugLog('Submission created successfully in new schema:', data);
      
      // Optimistic update to local state
      updateState({ submissions: [data as unknown as FormSubmission, ...submissions] });
      
      return data;
    } catch (error: any) {
      debugLog('Exception creating submission:', error);
      Alert.alert('Error', `Failed to create submission: ${error.message}`);
      throw error;
    }
  };

  // Update submission
  const updateSubmission = async (id: string, updates: Partial<Omit<FormSubmission, 'id' | 'submitted_at'>>) => {
    try {
      debugLog('Updating submission in new schema...', { id, updates });

      // Validate submission exists
      const existingSubmission = submissions.find(s => s.id === id);
      if (!existingSubmission) {
        throw new Error('Submission not found');
      }

      // Prepare sanitized updates
      const sanitizedUpdates: any = {};

      if (updates.client_id !== undefined) {
        // Verify new client exists if client_id is being updated
        const { data: clientExists } = await supabase
          .from('clients')
          .select('id')
          .eq('id', updates.client_id)
          .single();

        if (!clientExists) {
          throw new Error('New client not found');
        }
        sanitizedUpdates.client_id = updates.client_id;
      }

      if (updates.email !== undefined) {
        sanitizedUpdates.email = updates.email.trim().toLowerCase();
      }
      if (updates.status !== undefined) {
        sanitizedUpdates.status = updates.status;
      }

      const { data, error } = await supabase
        .from('form_submissions')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select(`
          id,
          email,
          status,
          client_id,
          submitted_at,
          client:clients(
            id,
            name,
            email,
            phone,
            status
          )
        `)
        .single();

      if (error) {
        debugLog('Error updating submission:', error);
        throw error;
      }

      debugLog('Submission updated successfully in new schema:', data);
      
      // Update local state
      updateState({ 
        submissions: submissions.map(submission => 
          submission.id === id ? (data as unknown as FormSubmission) : submission
        )
      });
      
      return data;
    } catch (error: any) {
      debugLog('Exception updating submission:', error);
      Alert.alert('Error', `Failed to update submission: ${error.message}`);
      throw error;
    }
  };

  // Delete submission
  const deleteSubmission = async (id: string) => {
    try {
      debugLog('Deleting submission from new schema...', id);

      // Validate submission exists
      const existingSubmission = submissions.find(s => s.id === id);
      if (!existingSubmission) {
        throw new Error('Submission not found');
      }

      const { error } = await supabase
        .from('form_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        debugLog('Error deleting submission:', error);
        throw error;
      }

      debugLog('Submission deleted successfully from new schema');
      
      // Remove from local state
      updateState({ 
        submissions: submissions.filter(submission => submission.id !== id)
      });
      
    } catch (error: any) {
      debugLog('Exception deleting submission:', error);
      Alert.alert('Error', `Failed to delete submission: ${error.message}`);
      throw error;
    }
  };

  // Get submissions for specific date range
  const getSubmissionsForDateRange = (startDate: Date, endDate: Date) => {
    return submissions.filter(submission => {
      const submissionDate = new Date(submission.submitted_at);
      return submissionDate >= startDate && submissionDate <= endDate;
    });
  };

  // Get recent submissions (last 7 days)
  const getRecentSubmissions = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return getSubmissionsForDateRange(sevenDaysAgo, new Date());
  };

  // Get new submissions (last 24 hours)
  const getNewSubmissions = () => {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    return getSubmissionsForDateRange(twentyFourHoursAgo, new Date());
  };

  // Search submissions by email (form_data doesn't exist in new schema)
  const searchSubmissions = (query: string) => {
    if (!query.trim()) return submissions;
    
    const lowercaseQuery = query.toLowerCase();
    return submissions.filter(submission => {
      // form_data field doesn't exist in new schema, only search by email
      return submission.email.toLowerCase().includes(lowercaseQuery) ||
             (submission.client?.name || '').toLowerCase().includes(lowercaseQuery);
    });
  };

  // Get submissions by client
  const getSubmissionsByClient = (clientId: string) => {
    return submissions.filter(submission => submission.client_id === clientId);
  };

  // Get submissions statistics
  const getSubmissionStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: submissions.length,
      today: getSubmissionsForDateRange(today, new Date()).length,
      thisWeek: getSubmissionsForDateRange(thisWeek, new Date()).length,
      thisMonth: getSubmissionsForDateRange(thisMonth, new Date()).length,
      recent: getRecentSubmissions().length,
    };
  };

  // Form analytics disabled since form_data field doesn't exist in new schema
  const getFormAnalytics = () => {
    // form_data field doesn't exist in new schema
    return {
      industries: {},
      budgets: {},
      timelines: {},
      employeeSizes: {},
    };
  };

  // Create submission from form and link to existing client
  const createSubmissionFromForm = async (formData: Record<string, any>, clientId?: string) => {
    try {
      let finalClientId = clientId;
      
      // If no client ID provided, try to find or create client from form data
      if (!finalClientId && formData.email) {
        // Check if client exists with this email
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('email', formData.email.toLowerCase())
          .single();
          
        if (existingClient) {
          finalClientId = existingClient.id;
        } else if (formData.company_name || formData.contact_person) {
          // Create new client from form data
          const { data: newClient } = await supabase
            .from('clients')
            .insert([{
              name: formData.company_name || formData.contact_person || 'Unknown',
              email: formData.email.toLowerCase(),
              phone: formData.phone || '',
              status: 'in_progress' as const,
              notes: `Created from onboarding submission - ${formData.industry || 'No industry specified'}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])
            .select('id')
            .single();
            
          if (newClient) {
            finalClientId = newClient.id;
          }
        }
      }
      
      if (!finalClientId) {
        throw new Error('Could not determine or create client for submission');
      }
      
      return await createSubmission({ 
        client_id: finalClientId, 
        email: formData.email || 'unknown@example.com',
        status: 'pending'
        // form_data field doesn't exist in new schema
      });
    } catch (error: any) {
      debugLog('Exception creating submission from form:', error);
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchSubmissions();

    // Subscribe to real-time changes with enhanced error handling
    const subscription = supabase
      .channel('form_submissions_realtime_new_schema')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'form_submissions' },
        (payload) => {
          debugLog('Real-time submission change in new schema:', payload);
          
          try {
            if (payload.eventType === 'INSERT') {
              // Re-fetch to get complete client data
              fetchSubmissions(false);
            } else if (payload.eventType === 'UPDATE') {
              // Update existing submission while preserving client data
              updateState({ 
                submissions: submissions.map(submission => 
                  submission.id === payload.new.id 
                    ? { ...submission, ...payload.new } as FormSubmission 
                    : submission
                )
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              updateState({ 
                submissions: submissions.filter(submission => submission.id !== deletedId)
              });
            }
          } catch (error) {
            debugLog('Error handling real-time update:', error);
            // Re-fetch data on error to ensure consistency
            fetchSubmissions(false);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          debugLog('Successfully subscribed to submissions real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          debugLog('Channel error:', err);
        } else if (status === 'TIMED_OUT') {
          debugLog('Real-time subscription timed out');
        } else if (status === 'CLOSED') {
          debugLog('Real-time subscription closed');
        }
      });

    return () => {
      debugLog('Cleaning up submissions subscription');
      subscription.unsubscribe();
    };
  }, []);

  return {
    submissions,
    loading,
    error,
    getSubmissionById,
    createSubmission,
    createSubmissionFromForm,
    updateSubmission,
    deleteSubmission,
    getSubmissionsForDateRange,
    getRecentSubmissions,
    getNewSubmissions,
    searchSubmissions,
    getSubmissionsByClient,
    getSubmissionStats,
    getFormAnalytics,
    refetch: () => fetchSubmissions(true),
    refetchSilent: () => fetchSubmissions(false),
  };
}