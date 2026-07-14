import { useCallback, useEffect, useState } from 'react';
import { toast } from '@heroui/react';
import { getMyCompany, type RecruiterCompanyProfile } from '../lib/me-api';

type RecruiterPostingAccessState = {
  company: RecruiterCompanyProfile | null;
  loading: boolean;
  error: string | null;
};

const getBlockedMessage = (company: RecruiterCompanyProfile | null, error: string | null) => {
  if (error) {
    return 'We could not verify your company approval. Refresh the page and try again.';
  }

  if (company?.approvalStatus === 'Rejected') {
    return 'Your company registration was rejected. Update the company profile before creating job postings.';
  }

  return 'Your company is awaiting admin approval. You can create job postings after it has been approved.';
};

export const useRecruiterPostingAccess = (enabled = true) => {
  const [state, setState] = useState<RecruiterPostingAccessState>({
    company: null,
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    void getMyCompany().then(
      (response) => {
        if (!cancelled) {
          setState({ company: response.data, loading: false, error: null });
        }
      },
      (loadError: unknown) => {
        if (!cancelled) {
          setState({
            company: null,
            loading: false,
            error: loadError instanceof Error ? loadError.message : 'Unable to verify company approval',
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const canCreatePosting = state.company?.isApproved === true;
  const isBlocked = enabled && !state.loading && !canCreatePosting;
  const showBlockedToast = useCallback(() => {
    toast.warning('Job posting creation is unavailable', {
      description: getBlockedMessage(state.company, state.error),
    });
  }, [state.company, state.error]);

  return {
    ...state,
    canCreatePosting,
    isBlocked,
    showBlockedToast,
  };
};
