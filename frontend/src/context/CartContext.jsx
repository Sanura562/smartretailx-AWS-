import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'smrx_cart'

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // ignore storage errors
    }
  }, [cart])

  const addToCart = useCallback((product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: product.price,
          image_url: product.image_url,
        },
      ]
    })
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId))
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item,
      ),
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [cart],
  )

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  )

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook pattern
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}
