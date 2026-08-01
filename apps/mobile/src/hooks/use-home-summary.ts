import { useEffect, useState } from 'react';

import { fetchHomeSummary } from '@/api/home-api';
import { homeSummaryFixture, type HomeSummary } from '@/data/home-data';

type HomeSummaryState = {
  data: HomeSummary;
  isLoading: boolean;
  error: string | null;
};

export function useHomeSummary() {
  const [state, setState] = useState<HomeSummaryState>({
    data: homeSummaryFixture,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadHomeSummary() {
      try {
        const data = await fetchHomeSummary(homeSummaryFixture, controller.signal);
        setState({ data, isLoading: false, error: null });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unable to load Home summary',
        }));
      }
    }

    void loadHomeSummary();

    return () => controller.abort();
  }, []);

  return state;
}
