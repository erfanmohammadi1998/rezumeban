import axios from "axios";

export const API_BASE =
    import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api/";

const api = axios.create({
    baseURL: API_BASE,
});


export function getAccess() {
    return localStorage.getItem("access");
}

export function getRefresh() {
    return localStorage.getItem("refresh");
}

export function setTokens({ access, refresh }) {
    if (access) localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);
}

export function clearTokens() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
}


api.interceptors.request.use((config) => {
    const token = getAccess();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});


let refreshing = null;

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const original = error.config;

        const status = error.response?.status;
        const refresh = getRefresh();

        if (status !== 401 || original._retry || !refresh) {
            return Promise.reject(error);
        }

        original._retry = true;

        try {
            refreshing =
                refreshing ||
                axios.post(`${API_BASE}auth/token/refresh/`, { refresh });

            const { data } = await refreshing;
            refreshing = null;

            setTokens({ access: data.access });
            original.headers.Authorization = `Bearer ${data.access}`;

            return api(original);
        } catch (refreshError) {
            refreshing = null;
            clearTokens();

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }

            return Promise.reject(refreshError);
        }
    }
);


export default api;
