import { useEffect, useState } from 'react';

import { fetchHomeData } from '@/api/home-api';
import { homeData, type HomeData } from '@/data/home-data';

type HomeDataState = {
  data: HomeData;
  isLoading: boolean;
  error: string | null;
};

export function useHomeData() {
  const [state, setState] = useState<HomeDataState>({
    data: homeData,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadHomeData() {
      try {
        const data = await fetchHomeData(homeData, controller.signal);
        setState({ data, isLoading: false, error: null });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unable to load Home data',
        }));
      }
    }

    void loadHomeData();

    return () => controller.abort();
  }, []);

  return state;
}
