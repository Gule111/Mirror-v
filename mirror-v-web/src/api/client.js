import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const taskApi = {
  // Pass FormData for the file upload
  createTask: (formData) => {
    return client.post('/tasks/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getTaskStatus: (taskId) => {
    return client.get(`/tasks/${taskId}`);
  }
};

export default client;
