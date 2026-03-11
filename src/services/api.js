import axios from 'axios';

const API_BASE_URL = 'https://deepapiservice.azurewebsites.net/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('camp_portal_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (kick to login)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('camp_portal_token');
            localStorage.removeItem('camp_portal_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH ====================
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    logout: (data) => api.post('/auth/logout', data),
};

// ==================== CAMPS ====================
export const campsAPI = {
    getAll: (params) => api.get('/camps', { params }),
    getById: (id) => api.get(`/camps/${id}`),
    getByProject: (projectId, params) => api.get(`/camps/project/${projectId}`, { params }),
    getProjectStats: (projectId) => api.get(`/camps/project/${projectId}/stats`),
    deleteCamp: (id) => api.delete(`/camps/${id}`),
};

// ==================== CAMP REGISTRATIONS ====================
export const campRegistrationAPI = {
    getFields: (campId) => api.get(`/camp-registrations/fields/${campId}`),
    getPublicFields: (campCode) => api.get(`/camp-registrations/public/${campCode}/fields`),
    getRegistrations: (campId, params) => api.get(`/camp-registrations/registrations/${campId}`, { params }),
    getRegistration: (registrationId) => api.get(`/camp-registrations/registration/${registrationId}`),
    createRegistration: (data) => api.post('/camp-registrations/public/register', data),
    updateRegistration: (registrationId, data) => api.put(`/camp-registrations/registration/${registrationId}`, data),
    deleteRegistration: (registrationId) => api.delete(`/camp-registrations/registration/${registrationId}`),
    exportExcel: (campId, params) => api.get(`/camp-registrations/export/${campId}`, {
        params,
        responseType: 'blob'
    }),
};

export default api;
