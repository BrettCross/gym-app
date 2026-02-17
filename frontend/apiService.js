import axios from 'axios';

// custom Axios instance
const apiService = axios.create({
  baseURL: 'http://localhost:8000',
});

// Add a request interceptor
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken'); 
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiService;
