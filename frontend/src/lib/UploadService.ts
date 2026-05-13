import axios from 'axios';
import { useAuthStore } from './store'; // Assuming token is here

const UPLOAD_URL = 'http://localhost:8000/upload';

export const UploadService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // We need the admin token to upload
    const token = useAuthStore.getState().token;

    try {
      const response = await axios.post(UPLOAD_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      return response.data.url;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.detail || 'Upload failed');
      }
      throw new Error('Network error during upload');
    }
  }
};
