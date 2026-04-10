import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.53:3000'
});

// Interceptor para adicionar o token nas requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // mesmo nome usado no AuthContext
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken'); // remove token inválido
      window.location.href = '/'; // força redirecionamento
    }
    return Promise.reject(error);
  }
);

export default api;