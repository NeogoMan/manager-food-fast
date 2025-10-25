/**
 * API utility functions for making HTTP requests
 */

const API_BASE_URL = '/api';
const TOKEN_KEY = 'auth_token';

/**
 * Token management
 */
export const tokenManager = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  remove: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * Generic fetch wrapper with error handling and authentication
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const token = tokenManager.get();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      tokenManager.remove();
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Menu API functions
export const menuAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/menu${query ? `?${query}` : ''}`);
  },

  getById: (id) => fetchAPI(`/menu/${id}`),

  getCategories: () => fetchAPI('/menu/categories'),

  create: (data) =>
    fetchAPI('/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    fetchAPI(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    fetchAPI(`/menu/${id}`, {
      method: 'DELETE',
    }),
};

// Orders API functions
export const ordersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/orders${query ? `?${query}` : ''}`);
  },

  getById: (id) => fetchAPI(`/orders/${id}`),

  create: (data) =>
    fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id, status) =>
    fetchAPI(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: (id) =>
    fetchAPI(`/orders/${id}`, {
      method: 'DELETE',
    }),

  // Order approval functions
  getPendingApproval: () => fetchAPI('/orders/pending-approval'),

  approve: (id) =>
    fetchAPI(`/orders/${id}/approve`, {
      method: 'POST',
    }),

  reject: (id, reason) =>
    fetchAPI(`/orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// Authentication API functions
export const authAPI = {
  login: async (username, password) => {
    const response = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.token) {
      tokenManager.set(response.token);
    }

    return response;
  },

  logout: async () => {
    try {
      await fetchAPI('/auth/logout', {
        method: 'POST',
      });
    } finally {
      tokenManager.remove();
    }
  },

  getCurrentUser: () => fetchAPI('/auth/me'),

  changePassword: (currentPassword, newPassword) =>
    fetchAPI('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Users API functions (Manager only)
export const usersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/users${query ? `?${query}` : ''}`);
  },

  getById: (id) => fetchAPI(`/users/${id}`),

  getByRole: (role) => fetchAPI(`/users/role/${role}`),

  create: (data) =>
    fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    fetchAPI(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Dashboard API functions (Manager only)
export const dashboardAPI = {
  getStatistics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/dashboard/statistics${query ? `?${query}` : ''}`);
  },

  getFilterOptions: () => fetchAPI('/dashboard/filters'),
};
