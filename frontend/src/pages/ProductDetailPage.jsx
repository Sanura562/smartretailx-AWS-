import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProduct, getInventory } from '../services/api'
import { useCart } from '../context/CartContext'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><rect width="500" height="500" fill="#F5F5F7"/><path d="M150 320l60-75 50 55 75-100 90 120H150z" fill="#D2D2D7"/><circle cx="185" cy="185" r="38" fill="#D2D2D7"/></svg>`,
  )

function stockStatus(quantity) {
  if (quantity <= 0) return { label: 'Out of Stock', className: 'bg-[#FF3B30]/10 text-[#FF3B30]' }
  if (quantity <= 5) return { label: 'Low Stock', className: 'bg-[#FF6B00]/10 text-[#FF6B00]' }
  return { label: 'In Stock', className: 'bg-[#1D7A1D]/10 text-[#1D7A1D]' }
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [stock, setStock] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset loading state when the product id changes
    setIsLoading(true)
    setError('')

    Promise.all([getProduct(id), getInventory(id)])
      .then(([productData, inventoryData]) => {
        if (cancelled) return
        setProduct(productData)
        setStock(inventoryData?.quantity ?? inventoryData?.stock ?? 0)
        setQuantity(1)
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load this product. Please try again later.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] animate-pulse px-12 py-20">
        <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
          <div className="h-[500px] rounded-2xl bg-[#F5F5F7]" />
          <div className="space-y-4">
            <div className="h-4 w-1/3 rounded bg-[#F5F5F7]" />
            <div className="h-10 w-3/4 rounded bg-[#F5F5F7]" />
            <div className="h-6 w-1/4 rounded bg-[#F5F5F7]" />
            <div className="h-4 w-full rounded bg-[#F5F5F7]" />
            <div className="h-4 w-2/3 rounded bg-[#F5F5F7]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[1200px] px-12 py-20 text-center">
        <p className="text-lg font-medium text-[#1D1D1F]">{error || 'Product not found.'}</p>
        <Link to="/" className="mt-4 inline-block text-[#0071E3] hover:underline">
          &larr; Back to products
        </Link>
      </div>
    )
  }

  const status = stockStatus(stock ?? 0)
  const outOfStock = (stock ?? 0) <= 0
  const thumbnails = Array.from({ length: 4 })

  return (
    <div className="mx-auto max-w-[1200px] px-12 py-20">
      <Link to="/" className="mb-8 inline-block text-sm font-medium text-[#0071E3] hover:underline">
        &larr; Back to products
      </Link>

      <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
        <div>
          <div className="flex h-[500px] w-full items-center justify-center overflow-hidden rounded-[24px] bg-[#F5F5F7]">
            <img
              src={product.image_url || PLACEHOLDER_IMAGE}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_IMAGE
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {thumbnails.map((_, i) => (
              <div
                key={i}
                className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-[#F5F5F7]"
              >
                <img
                  src={product.image_url || PLACEHOLDER_IMAGE}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMAGE
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          {product.category && (
            <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[0.5px] text-[#0071E3]">
              {product.category}
            </span>
          )}
          <h1 className="text-[40px] font-bold leading-[1.1] text-[#1D1D1F]">{product.name}</h1>
          <p className="my-4 text-[28px] font-bold text-[#1D1D1F]">${Number(product.price).toFixed(2)}</p>
          <span className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
          <p className="my-6 leading-[1.6] text-[#6E6E73]">
            {product.description || 'No description available.'}
          </p>

          {!outOfStock && (
            <div className="mb-6 flex items-center gap-3">
              <label className="text-sm font-medium text-[#1D1D1F]">Quantity</label>
              <div className="flex items-center rounded-lg border border-[#D2D2D7]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
                >
                  &minus;
                </button>
                <span className="w-10 text-center text-sm font-medium text-[#1D1D1F]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                  className="flex h-10 w-10 items-center justify-center text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            disabled={outOfStock}
            onClick={() => {
              addToCart(product, quantity)
              setAdded(true)
              setTimeout(() => setAdded(false), 2000)
            }}
            className={`h-[52px] w-full rounded-xl text-[17px] font-semibold text-white transition ${
              outOfStock ? 'cursor-not-allowed bg-[#D2D2D7]' : 'bg-[#0071E3] hover:bg-[#0077ED]'
            }`}
          >
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>

          <button
            onClick={() => setWishlisted((w) => !w)}
            className="mt-3 h-[52px] w-full rounded-xl border-[1.5px] border-[#D2D2D7] bg-white text-[17px] font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
          >
            {wishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}
          </button>

          {added && <p className="mt-3 text-sm font-medium text-[#1D7A1D]">Added to cart!</p>}
        </div>
      </div>
    </div>
  )
}
