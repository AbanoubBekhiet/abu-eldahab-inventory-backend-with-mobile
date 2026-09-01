import axios from 'axios'

const API_BASE_URL = '/api'

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
})

// Attach Bearer token from localStorage to every API request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
}, (error) => {
    return Promise.reject(error)
})

// Handle Global 401 Unauthenticated Responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export const setAuthToken = (token, user) => {
    if (token) {
        localStorage.setItem('auth_token', token)
        if (user) localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
    }
}

export const getAuthUser = () => {
    const userStr = localStorage.getItem('auth_user')
    try {
        return userStr ? JSON.parse(userStr) : null
    } catch {
        return null
    }
}

export const clearAuthToken = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
}

export const getUserRole = () => {
    const user = getAuthUser()
    return user?.role || 'customer'
}

export const isAdmin = () => {
    return getUserRole() === 'admin'
}

export const isSubAdmin = () => {
    return getUserRole() === 'sub_admin'
}

export const isCustomer = () => {
    return getUserRole() === 'customer'
}

export const isStaff = () => {
    return ['admin', 'sub_admin'].includes(getUserRole())
}

export default api
