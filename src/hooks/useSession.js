import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      // Backend now handles user authentication automatically via JWT token
      const response = await client.post('/api/sessions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data; // Expected { id: '...', ... }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useSessionReport = (sessionId) => {
  return useQuery({
    queryKey: ['session', sessionId, 'report'],
    queryFn: async () => {
      const response = await client.get(`/api/sessions/${sessionId}/report`);
      return response.data;
    },
    // Poll every 3 seconds while status === "processing"
    refetchInterval: (query) => {
      const data = query?.state?.data;
      if (data && data.status === 'processing') {
        return 3000;
      }
      return false;
    },
    enabled: !!sessionId,
    retry: 1,
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const { sessionId, questionnaire, encodedFeatures } = data;
      
      const formData = new FormData();
      formData.append('questionnaire', questionnaire);
      formData.append('encodedFeatures', encodedFeatures);
      
      const response = await client.put(`/api/sessions/${sessionId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useSessionsList = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      // Backend now handles user authentication automatically via JWT token
      const response = await client.get('/api/sessions');
      return response.data;
    },
    retry: 1,
  });
};
