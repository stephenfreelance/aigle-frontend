import { AUTH_REFRESH_TOKEN_ENDPOINT } from '@/api-endpoints';
import { useAuth } from '@/utils/auth';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuth.getState().accessToken;

    if (token) {
      config.headers['Authorization'] = `JWT ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuth.getState().refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(AUTH_REFRESH_TOKEN_ENDPOINT, {
            token: refreshToken,
          });

          useAuth.setState({
            accessToken: data.accessToken,
          });
          
          api.defaults.headers['Authorization'] = `JWT ${data.access}`;
          originalRequest.headers['Authorization'] = `JWT ${data.access}`;

          return api(originalRequest);
        } catch (refreshError) {
          useAuth.setState({
            accessToken: undefined,
            refreshToken: undefined,
            userMe: undefined
          });

          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
