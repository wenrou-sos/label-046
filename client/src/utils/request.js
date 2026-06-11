import axios from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../store';

const request = axios.create({
  baseURL: '/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code && res.code !== 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || 'Request failed'));
    }
    return res;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('登录已过期，请重新登录'));
      }

      if (status === 403) {
        message.error('权限不足，无法执行此操作');
        return Promise.reject(new Error('权限不足'));
      }

      if (status === 404) {
        message.error('请求的资源不存在');
        return Promise.reject(new Error('资源不存在'));
      }

      if (status === 500) {
        message.error('服务器内部错误，请稍后重试');
        return Promise.reject(new Error('服务器错误'));
      }

      const errMsg = data?.message || error.message || '请求失败';
      message.error(errMsg);
      return Promise.reject(new Error(errMsg));
    }

    if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试');
      return Promise.reject(new Error('请求超时'));
    }

    message.error(error.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request;

export const apiGet = (url, params, config = {}) =>
  request.get(url, { params, ...config });

export const apiPost = (url, data, config = {}) =>
  request.post(url, data, config);

export const apiPut = (url, data, config = {}) =>
  request.put(url, data, config);

export const apiPatch = (url, data, config = {}) =>
  request.patch(url, data, config);

export const apiDelete = (url, config = {}) =>
  request.delete(url, config);

export const uploadFile = (url, formData, onProgress) =>
  request.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress ?
      (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        onProgress(percent);
      } : undefined
  });
