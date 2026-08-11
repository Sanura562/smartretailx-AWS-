import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { createOrder } from '../services/api'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#F5F5F7"/><path d="M60 130l30-38 20 22 30-40 36 56H60z" fill="#D2D2D7"/><circle cx="75" cy="75" r="15" fill="#D2D2D7"/></svg>`,
  )

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function CartEmptyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mx-auto h-20 w-20 text-[#D2D2D7]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.994-4.694 2.602-7.163.084-.34-.17-.67-.52-.67H5.106M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  )
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    setError('')
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } })
      return
    }

    setIsCheckingOut(true)
    try {
      const items = cart.map(({ product_id, product_name, quantity, unit_price }) => ({
        product_id,
        product_name,
        quantity,
        unit_price,
      }))
      const order = await createOrder(user.id, items)
      clearCart()
      navigate(`/orders`, { state: { justPlacedOrderId: order?.id } })
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          'Could not complete checkout. Please try again.',
      )
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-24 text-center">
        <CartEmptyIcon />
        <p className="mt-6 text-2xl font-semibold text-[#1D1D1F]">Your bag is empty</p>
        <p className="mt-2 text-sm text-[#6E6E73]">Looks like you haven't added anything yet.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-[#0071E3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ED]"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] px-12 pb-20 pt-6">
      <h1 className="pb-6 text-[32px] font-bold text-[#1D1D1F]">Your Cart</h1>

      {error && (
        <div className="mb-6 rounded-lg bg-[#FF3B30]/10 px-4 py-3 text-sm text-[#FF3B30]">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[65%_35%]">
        <div>
          {cart.map((item) => (
            <div
              key={item.product_id}
              className="mb-4 flex items-center gap-4 rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            >
              <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F5F5F7]">
                <img
                  src={item.image_url || PLACEHOLDER_IMAGE}
                  alt={item.product_name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMAGE
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-[#1D1D1F]">{item.product_name}</p>
                <p className="mt-1 text-sm font-bold text-[#0071E3]">
                  ${Number(item.unit_price).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center rounded-lg border border-[#D2D2D7]">
                <button
                  onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
                >
                  &minus;
                </button>
                <span className="w-9 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
                >
                  +
                </button>
              </div>
              <p className="w-20 text-right font-bold text-[#1D1D1F]">
                ${(item.unit_price * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => removeFromCart(item.product_id)}
                className="text-sm font-medium text-[#FF3B30] hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-[20px] bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.08)] lg:sticky lg:top-[72px]">
          <h2 className="mb-4 text-xl font-bold text-[#1D1D1F]">Order Summary</h2>
          <div className="mb-2 flex justify-between text-sm text-[#6E6E73]">
            <span>Subtotal ({cartCount} items)</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="my-4 border-t border-[#E8E8ED]" />
          <div className="mb-6 flex justify-between text-lg font-bold text-[#1D1D1F]">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="h-[52px] w-full rounded-xl bg-[#0071E3] text-[17px] font-semibold text-white transition hover:bg-[#0077ED] disabled:opacity-60"
          >
            {isCheckingOut ? 'Placing order...' : 'Proceed to Checkout'}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#6E6E73]">
            <LockIcon /> Secure checkout
          </p>
          <Link to="/" className="mt-3 block text-center text-sm font-medium text-[#0071E3] hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
