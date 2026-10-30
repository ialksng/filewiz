import axios from 'axios';
import apiBase from './apiBase';

const apiClient = axios.create({
    baseURL: apiBase,
});

apiClient.interceptors.request.use((config) => {
    const userInfo = localStorage.getItem('userInfo'); 
    
    if (userInfo) {
        const parsed = JSON.parse(userInfo);
        if (parsed.token) {
            config.headers.Authorization = `Bearer ${parsed.token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;
