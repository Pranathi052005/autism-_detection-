import { useMutation, useQuery } from '@tanstack/react-query';
import client from '../api/client';

// Video analysis hook
export const useVideoAnalysis = () => {
  return useMutation({
    mutationFn: async (videoFile) => {
      const formData = new FormData();
      formData.append('file', videoFile);

      const response = await client.post('/api/screening/video', formData, {
        timeout: 300000,
      });

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Video analysis completed:', data);
    },
    onError: (error) => {
      console.error('❌ Video analysis failed:', error);
      // Log the actual FastAPI validation error
      if (error.response?.data) {
        console.error('❌ FastAPI error detail:',
          JSON.stringify(error.response.data, null, 2));
      }
    },
  });
};

// Audio analysis hook
export const useAudioAnalysis = () => {
  return useMutation({
    mutationFn: async (audioFile) => {
      const formData = new FormData();
      formData.append('file', audioFile);

      const response = await client.post('/api/screening/audio', formData, {
        timeout: 300000,
      });

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Audio analysis completed:', data);
    },
    onError: (error) => {
      console.error('❌ Audio analysis failed:', error);
      // Log the actual FastAPI validation error
      if (error.response?.data) {
        console.error('❌ FastAPI error detail:',
          JSON.stringify(error.response.data, null, 2));
      }
    },
  });
};

// Helper function to encode questionnaire answers correctly
export const encodeAnswers = (rawAnswers) => {
  const encoded = {};
  for (let i = 1; i <= 10; i++) {
    const key = `A${i}`;
    const val = rawAnswers[key] ?? rawAnswers[key.toLowerCase()] ?? 0;
    encoded[key] = typeof val === 'boolean' ? (val ? 1 : 0) : parseInt(val) || 0;
  }
  return encoded;
};

// Full screening fusion hook - handles three-step flow
export const useFullScreening = () => {
  return useMutation({
    mutationFn: async (screeningData) => {
      console.log('=== FULL SCREENING REQUEST BODY ===');
      console.log('📦 Screening payload:', screeningData);
      console.log('🎥 Video risk score in payload:', screeningData.video_risk_score);
      console.log('🎵 Audio risk score in payload:', screeningData.audio_risk_score);
      console.log('🎥 Video features in payload:', screeningData.video_features);
      console.log('🎵 Audio features in payload:', screeningData.audio_features);
      console.log(JSON.stringify(screeningData, null, 2));

      const response = await client.post('/api/screening/full', screeningData, {
        timeout: 300000, // 5 minutes timeout for AI processing
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Full screening completed:', data);
      console.log('📊 Response received:', data);
      console.log('🎥 Video score in response:', data.video_score);
      console.log('🎵 Audio score in response:', data.audio_score);
      console.log('📋 Questionnaire score in response:', data.questionnaire_score);
    },
    onError: (error) => {
      console.error('❌ Full screening failed:', error);
      // Log the actual FastAPI validation error
      if (error.response?.data) {
        console.error('❌ FastAPI error detail:',
          JSON.stringify(error.response.data, null, 2));
      }
    },
  });
};

// Screening result by ID hook
export const useScreeningResult = (resultId) => {
  return useQuery({
    queryKey: ['screening-result', resultId],
    queryFn: async () => {
      const token = localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('authToken');

      const response = await client.get(`/api/screening/result/${resultId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      return response.data;
    },
    enabled: !!resultId,
    retry: 1,
  });
};

// Screening history hook
export const useScreeningHistory = (userId) => {
  return useQuery({
    queryKey: ['screening-history', userId],
    queryFn: async () => {
      const token = localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('authToken');

      const response = await client.get(`/api/screening/history${userId ? `?user_id=${userId}` : ''}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      return response.data;
    },
    enabled: !!userId,
  });
};
