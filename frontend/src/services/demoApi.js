// Demo mode: lets the frontend run on built-in sample data with no backend.
//
// Enabled at build time with VITE_DEMO_MODE=true (see README). Every function
// here mirrors an export of ./api.js and returns the same shapes the real
// services return. State lives in memory only, so it resets on page reload.

const DAY = 86400000
const ago = (days) => new Date(Date.now() - days * DAY).toISOString()

// Resolve a copy of the value after a short delay so loading states are visible
// and callers can't mutate the store by accident.
const respond = (value, ms = 250) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), ms)
  })

// Reject with the same shape axios errors have, so pages can read
// err.response.data.detail like they do with the real API.
const fail = (status, detail) =>
  new Promise((_, reject) => {
    setTimeout(() => {
      reject(Object.assign(new Error(detail), { response: { status, data: { detail } } }))
    }, 250)
  })

// Placeholder product art as an inline SVG, so the demo needs no image hosting.
function art(emoji, from, to) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs><rect width="600" height="600" fill="url(#g)"/>` +
    `<text x="300" y="350" font-size="180" text-anchor="middle">${emoji}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// ---------- Sample data ----------

const users = [
  { id: 1, email: 'admin@smartretailx.example', full_name: 'Demo Admin', role: 'admin', created_at: ago(90) },
  { id: 2, email: 'nimal@smartretailx.example', full_name: 'Nimal Perera', role: 'customer', created_at: ago(60) },
  { id: 3, email: 'ayesha@smartretailx.example', full_name: 'Ayesha Fernando', role: 'customer', created_at: ago(34) },
  { id: 4, email: 'kasun@smartretailx.example', full_name: 'Kasun Silva', role: 'customer', created_at: ago(12) },
]

const products = [
  { id: 1, sku: 'AUD-1001', name: 'Wireless Headphones', category: 'Audio', price: 129.99, image_url: art('🎧', '#dbeafe', '#93c5fd'), description: 'Over-ear Bluetooth headphones with active noise cancelling and a 30-hour battery.' },
  { id: 2, sku: 'AUD-1002', name: 'Bluetooth Speaker', category: 'Audio', price: 89.5, image_url: art('🔊', '#fce7f3', '#f9a8d4'), description: 'Portable waterproof speaker with deep bass and 12 hours of playback.' },
  { id: 3, sku: 'AUD-1003', name: 'Studio Earbuds', category: 'Audio', price: 79.0, image_url: art('🎵', '#ede9fe', '#c4b5fd'), description: 'True wireless earbuds with a compact charging case and clear call quality.' },
  { id: 4, sku: 'WRB-2001', name: 'Smart Watch', category: 'Wearables', price: 249.0, image_url: art('⌚', '#dcfce7', '#86efac'), description: 'Heart-rate, sleep and GPS tracking with a bright always-on display.' },
  { id: 5, sku: 'WRB-2002', name: 'Fitness Band', category: 'Wearables', price: 59.99, image_url: art('💪', '#fef9c3', '#fde047'), description: 'Lightweight activity tracker with a two-week battery and water resistance.' },
  { id: 6, sku: 'CMP-3001', name: 'Mechanical Keyboard', category: 'Computing', price: 109.0, image_url: art('⌨️', '#e0e7ff', '#a5b4fc'), description: 'Hot-swappable mechanical keyboard with tactile switches and white backlight.' },
  { id: 7, sku: 'CMP-3002', name: 'Wireless Mouse', category: 'Computing', price: 39.99, image_url: art('🖱️', '#ffedd5', '#fdba74'), description: 'Ergonomic silent mouse with adjustable DPI and a rechargeable battery.' },
  { id: 8, sku: 'CMP-3003', name: '4K Webcam', category: 'Computing', price: 119.0, image_url: art('📷', '#cffafe', '#67e8f9'), description: '4K webcam with autofocus, a privacy shutter and dual noise-reducing microphones.' },
  { id: 9, sku: 'ACC-4001', name: 'USB-C Cable', category: 'Accessories', price: 14.99, image_url: art('🔌', '#f1f5f9', '#cbd5e1'), description: 'Braided 2 m USB-C cable supporting fast charging and 10 Gbps data.' },
  { id: 10, sku: 'ACC-4002', name: 'Fast Charger 65W', category: 'Accessories', price: 34.5, image_url: art('⚡', '#fef3c7', '#fcd34d'), description: 'Compact 65 W GaN charger with two USB-C ports and one USB-A port.' },
  { id: 11, sku: 'HOM-5001', name: 'Smart Bulb Pack', category: 'Smart Home', price: 24.99, image_url: art('💡', '#fff7ed', '#fed7aa'), description: 'Four colour-changing Wi-Fi bulbs you can schedule and dim from your phone.' },
  { id: 12, sku: 'HOM-5002', name: 'Security Camera', category: 'Smart Home', price: 69.0, image_url: art('📹', '#f3e8ff', '#d8b4fe'), description: '1080p indoor camera with night vision, motion alerts and two-way audio.' },
]

const stock = { 1: 42, 2: 18, 3: 64, 4: 9, 5: 120, 6: 27, 7: 5, 8: 33, 9: 250, 10: 14, 11: 75, 12: 3 }

const inventory = products.map((p) => ({
  product_id: p.id,
  product_name: p.name,
  quantity: stock[p.id],
  threshold: 10,
  low_stock_threshold: 10,
}))

const lineItem = (productId, quantity) => {
  const p = products.find((x) => x.id === productId)
  return { product_id: p.id, product_name: p.name, quantity, unit_price: p.price }
}

const orderTotal = (items) =>
  Math.round(items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) * 100) / 100

function makeOrder(id, userId, status, daysAgo, items) {
  const total = orderTotal(items)
  return { id, user_id: userId, status, created_at: ago(daysAgo), items, total, total_amount: total }
}

const orders = [
  makeOrder(1001, 1, 'delivered', 14, [lineItem(1, 1), lineItem(9, 2)]),
  makeOrder(1002, 1, 'shipped', 2, [lineItem(4, 1)]),
  makeOrder(1003, 2, 'pending', 0.2, [lineItem(6, 1), lineItem(7, 1)]),
  makeOrder(1004, 3, 'confirmed', 1, [lineItem(2, 1), lineItem(10, 1)]),
  makeOrder(1005, 4, 'delivered', 6, [lineItem(11, 2)]),
  makeOrder(1006, 2, 'cancelled', 9, [lineItem(8, 1)]),
]

const notifications = [
  { id: 1, user_id: 1, message: 'Your order #1002 has shipped.', read: false, created_at: ago(1) },
  { id: 2, user_id: 1, message: 'Smart Watch is running low on stock.', read: false, created_at: ago(2) },
  { id: 3, user_id: 1, message: 'Your order #1001 was delivered.', read: true, created_at: ago(10) },
]

let nextProductId = products.length + 1
let nextOrderId = 1007
let nextNotificationId = notifications.length + 1
let nextUserId = users.length + 1

// ---------- Helpers ----------

// A JWT-shaped token. AuthContext only decodes the payload, so no signature is needed.
function demoToken(user) {
  const b64 = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const payload = { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.demo`
}

const findProduct = (id) => products.find((p) => p.id === Number(id))
const findInventory = (id) => inventory.find((i) => i.product_id === Number(id))

// ---------- User Service ----------

export async function registerUser(email, password, fullName) {
  const user = {
    id: nextUserId++,
    email,
    full_name: fullName || email,
    role: 'customer',
    created_at: new Date().toISOString(),
  }
  users.push(user)
  return respond(user)
}

// Any email and password signs in as the demo admin, so every page is reachable.
export async function loginUser(email) {
  const user = { ...users[0], email: email || users[0].email }
  return respond({ access_token: demoToken(user), user })
}

// ---------- Product Service ----------

export async function getProducts(category) {
  return respond(category ? products.filter((p) => p.category === category) : products)
}

export async function searchProducts(q) {
  const term = String(q ?? '').trim().toLowerCase()
  return respond(
    products.filter((p) =>
      [p.name, p.category, p.description, p.sku].some((field) => field.toLowerCase().includes(term)),
    ),
  )
}

export async function getProduct(id) {
  const product = findProduct(id)
  return product ? respond(product) : fail(404, 'Product not found')
}

export async function getCategories() {
  return respond([...new Set(products.map((p) => p.category))])
}

export async function createProduct(productData) {
  const product = {
    id: nextProductId++,
    sku: productData.sku || `NEW-${nextProductId}`,
    name: productData.name,
    category: productData.category || 'Accessories',
    price: Number(productData.price) || 0,
    image_url: productData.image_url || art('📦', '#f1f5f9', '#cbd5e1'),
    description: productData.description || '',
  }
  products.push(product)
  return respond(product)
}

export async function updateProduct(productId, productData) {
  const product = findProduct(productId)
  if (!product) return fail(404, 'Product not found')
  Object.assign(product, productData, {
    price: productData.price !== undefined ? Number(productData.price) : product.price,
  })
  const inv = findInventory(productId)
  if (inv) inv.product_name = product.name
  return respond(product)
}

export async function deleteProduct(productId) {
  const index = products.findIndex((p) => p.id === Number(productId))
  if (index === -1) return fail(404, 'Product not found')
  products.splice(index, 1)
  return respond({ message: 'Product deleted' })
}

// ---------- Inventory Service ----------

export async function getInventory(productId) {
  const inv = findInventory(productId)
  return inv ? respond(inv) : fail(404, 'Inventory record not found')
}

export async function getLowStock() {
  return respond(inventory.filter((i) => i.quantity <= i.threshold))
}

export async function updateInventory(productId, quantity) {
  const inv = findInventory(productId)
  if (!inv) return fail(404, 'Inventory record not found')
  inv.quantity = Math.max(0, Number(quantity) || 0)
  return respond(inv)
}

export async function createInventory(inventoryData) {
  const threshold = Number(inventoryData.low_stock_threshold) || 10
  const record = {
    product_id: Number(inventoryData.product_id),
    product_name: inventoryData.product_name || findProduct(inventoryData.product_id)?.name || '',
    quantity: Number(inventoryData.quantity) || 0,
    threshold,
    low_stock_threshold: threshold,
  }
  const existing = findInventory(record.product_id)
  if (existing) Object.assign(existing, record)
  else inventory.push(record)
  return respond(record)
}

// ---------- Order Service ----------

export async function createOrder(userId, items) {
  const lines = items.map((item) => {
    const product = findProduct(item.product_id)
    return {
      product_id: Number(item.product_id),
      product_name: item.product_name ?? product?.name ?? 'Item',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price ?? product?.price ?? 0),
    }
  })

  lines.forEach((line) => {
    const inv = findInventory(line.product_id)
    if (inv) inv.quantity = Math.max(0, inv.quantity - line.quantity)
  })

  const order = makeOrder(nextOrderId++, Number(userId), 'pending', 0, lines)
  orders.unshift(order)
  notifications.unshift({
    id: nextNotificationId++,
    user_id: Number(userId),
    message: `Your order #${order.id} has been placed.`,
    read: false,
    created_at: new Date().toISOString(),
  })
  return respond(order, 600)
}

export async function getOrder(orderId) {
  const order = orders.find((o) => o.id === Number(orderId))
  return order ? respond(order) : fail(404, 'Order not found')
}

export async function getUserOrders(userId) {
  return respond(orders.filter((o) => o.user_id === Number(userId)))
}

export async function getAllOrders() {
  return respond(orders)
}

export async function updateOrderStatus(orderId, status) {
  const order = orders.find((o) => o.id === Number(orderId))
  if (!order) return fail(404, 'Order not found')
  order.status = status
  return respond(order)
}

// ---------- Notification Service ----------

export async function getNotifications(userId) {
  return respond(notifications.filter((n) => n.user_id === Number(userId)))
}

export async function markNotificationRead(notificationId) {
  const notification = notifications.find((n) => n.id === Number(notificationId))
  if (notification) notification.read = true
  return respond(notification ?? { message: 'ok' })
}

// ---------- Admin ----------

export async function getAllUsers() {
  return respond(users)
}
