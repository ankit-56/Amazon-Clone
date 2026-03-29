import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  withCredentials: true
});

export default api;
