import axios from 'axios';
import { useAuthStore } from './store';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Interceptor to add the Bearer token to all requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
