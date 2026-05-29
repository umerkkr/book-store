const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  books: (query = '') => request(`/books${query}`),
  book: (id) => request(`/books/${id}`),
  cart: () => request('/cart'),
  addToCart: (payload) => request('/cart', { method: 'POST', body: JSON.stringify(payload) }),
  updateCartItem: (id, payload) => request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  removeCartItem: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
  createOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  orders: () => request('/orders'),
  adminOrders: () => request('/orders/admin/all'),
  updateOrderStatus: (id, payload) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  createBook: (payload) => request('/books', { method: 'POST', body: JSON.stringify(payload) }),
  updateBook: (id, payload) => request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' })
};
