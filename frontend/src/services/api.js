import axios from 'axios'

// Base axios instances for each service
const userApi = axios.create({ baseURL: 'http://localhost:8001' })
const productApi = axios.create({ baseURL: 'http://localhost:8002' })
const inventoryApi = axios.create({ baseURL: 'http://localhost:8003' })
const orderApi = axios.create({ baseURL: 'http://localhost:8004' })
const notificationApi = axios.create({ baseURL: 'http://localhost:8005' })

// Attach Authorization header to every authenticated service.
// userApi is intentionally excluded since register/login happen before a token exists.
const attachAuthInterceptor = (instance) => {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('smrx_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}

;[productApi, inventoryApi, orderApi, notificationApi].forEach(
  attachAuthInterceptor
)

// ---------- User Service ----------

export async function registerUser(email, password, fullName) {
  const { data } = await userApi.post('/api/v1/users/register', {
    email,
    password,
    full_name: fullName,
  })
  return data
}

export async function loginUser(email, password) {
  const { data } = await userApi.post('/api/v1/users/login', {
    email,
    password,
  })
  return data // { access_token, user }
}

// ---------- Product Service ----------

export async function getProducts(category) {
  const { data } = await productApi.get('/api/v1/products', {
    params: category ? { category } : undefined,
  })
  return data
}

export async function searchProducts(q) {
  const { data } = await productApi.get('/api/v1/products/search', {
    params: { q },
  })
  return data
}

export async function getProduct(id) {
  const { data } = await productApi.get(`/api/v1/products/${id}`)
  return data
}

export async function getCategories() {
  const { data } = await productApi.get('/api/v1/products/categories')
  return data
}

// ---------- Inventory Service ----------

export async function getInventory(productId) {
  const { data } = await inventoryApi.get(`/api/v1/inventory/${productId}`)
  return data
}

// ---------- Order Service ----------

export async function createOrder(userId, items) {
  const { data } = await orderApi.post('/api/v1/orders', {
    user_id: userId,
    items,
  })
  return data
}

export async function getOrder(orderId) {
  const { data } = await orderApi.get(`/api/v1/orders/${orderId}`)
  return data
}

export async function getUserOrders(userId) {
  const { data } = await orderApi.get(`/api/v1/orders/user/${userId}`)
  return data
}

// ---------- Notification Service ----------

export async function getNotifications(userId) {
  const { data } = await notificationApi.get(
    `/api/v1/notifications/user/${userId}`
  )
  return data
}

export async function markNotificationRead(notificationId) {
  const { data } = await notificationApi.patch(
    `/api/v1/notifications/${notificationId}/read`
  )
  return data
}

// ---------- Admin ----------

export async function getAllUsers() {
  const { data } = await userApi.get('/api/v1/users/all')
  return data
}

export async function updateOrderStatus(orderId, status) {
  const { data } = await orderApi.put(`/api/v1/orders/${orderId}/status`, { status })
  return data
}

export async function getAllOrders() {
  const { data } = await orderApi.get('/api/v1/orders/all')
  return data
}

export async function updateInventory(productId, quantity) {
  const { data } = await inventoryApi.put(`/api/v1/inventory/${productId}`, { quantity })
  return data
}

export async function deleteProduct(productId) {
  const { data } = await productApi.delete(`/api/v1/products/${productId}`)
  return data
}

export async function updateProduct(productId, productData) {
  const { data } = await productApi.put(`/api/v1/products/${productId}`, productData)
  return data
}

export async function createProduct(productData) {
  const { data } = await productApi.post('/api/v1/products', productData)
  return data
}

export async function getLowStock() {
  const { data } = await inventoryApi.get('/api/v1/inventory/low-stock')
  return data
}

export async function createInventory(inventoryData) {
  const { data } = await inventoryApi.post('/api/v1/inventory', inventoryData)
  return data
}
