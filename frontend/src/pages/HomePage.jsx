import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { getProducts, getCategories, searchProducts } from '../services/api'
import { useCart } from '../context/CartContext'
import hero1 from '../assets/Group 1.jpg'
import hero2 from '../assets/Group 2.jpg'
import hero3 from '../assets/Group 3.jpg'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#F5F5F7"/><path d="M120 260l50-60 40 45 60-80 70 95H120z" fill="#D2D2D7"/><circle cx="150" cy="150" r="30" fill="#D2D2D7"/></svg>`
  )

const HERO_SLIDES = [
  {
    title: 'The future of retail.',
    subtitle: 'Premium electronics, curated for you.',
    cta: 'Shop Now',
    imageUrl: hero1,
  },
  {
    title: 'Precision Engineered.',
    subtitle: 'Every detail matters.',
    cta: 'Explore',
    imageUrl: hero2,
  },
  {
    title: 'New Arrivals.',
    subtitle: 'The latest in tech.',
    cta: 'View Collection',
    imageUrl: hero3,
  },
]

function HeroSlider() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative h-[600px] w-full overflow-hidden bg-[#F5F5F7]">
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          className="absolute inset-0 transition-opacity duration-500 ease-in-out"
          style={{
            opacity: i === index ? 1 : 0,
            pointerEvents: i === index ? 'auto' : 'none',
          }}
        >
          <div className="mx-auto grid h-full max-w-[1200px] grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
            <div>
              <h1 className="text-[56px] font-bold leading-[1.05] text-[#1D1D1F]">
                {slide.title}
              </h1>
              <p className="mt-4 text-xl text-[#6E6E73]">{slide.subtitle}</p>
              <button
                onClick={scrollToProducts}
                className="mt-8 rounded-full bg-[#0071E3] px-8 py-3 text-base font-medium text-white transition hover:bg-[#0077ED]"
              >
                {slide.cta}
              </button>
            </div>
            <div className="hidden h-[420px] w-full overflow-hidden rounded-2xl md:flex">
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() =>
          setIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
        }
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:bg-white"
      >
        &#8249;
      </button>
      <button
        onClick={() => setIndex((i) => (i + 1) % HERO_SLIDES.length)}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:bg-white"
      >
        &#8250;
      </button>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-[#0071E3]' : 'w-2 bg-white/70'}`}
          />
        ))}
      </div>
    </section>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="h-[240px] w-full bg-[#F5F5F7]" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/4 rounded bg-[#F5F5F7]" />
        <div className="h-4 w-3/4 rounded bg-[#F5F5F7]" />
        <div className="h-5 w-1/3 rounded bg-[#F5F5F7]" />
      </div>
    </div>
  )
}

function ProductCard({ product, onAddToCart }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <Link
        to={`/products/${product.id}`}
        className="flex h-[240px] w-full items-center justify-center overflow-hidden rounded-t-2xl bg-[#F5F5F7]"
      >
        <img
          src={product.image_url || PLACEHOLDER_IMAGE}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER_IMAGE
          }}
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {product.category && (
          <span className="mb-1 text-xs font-medium uppercase tracking-[0.5px] text-[#0071E3]">
            {product.category}
          </span>
        )}
        <Link
          to={`/products/${product.id}`}
          className="mb-1 line-clamp-2 text-base font-semibold text-[#1D1D1F] hover:text-[#0071E3]"
        >
          {product.name}
        </Link>
        <p className="text-lg font-bold text-[#1D1D1F]">
          ${Number(product.price).toFixed(2)}
        </p>
        <button
          onClick={() => onAddToCart(product)}
          className="mt-4 h-10 w-full rounded-lg bg-[#0071E3] text-sm font-medium text-white opacity-100 transition-all duration-200 hover:bg-[#0077ED] md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const searchQuery = searchParams.get('search') ?? ''

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const { addToCart } = useCart()

  useEffect(() => {
    getCategories()
      .then((data) =>
        setCategories(Array.isArray(data) ? data : (data?.categories ?? []))
      )
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError('')

    const fetchProducts = searchQuery
      ? searchProducts(searchQuery)
      : getProducts(activeCategory || undefined)

    fetchProducts
      .then((data) => {
        if (!cancelled)
          setProducts(Array.isArray(data) ? data : (data?.products ?? []))
      })
      .catch(() => {
        if (!cancelled)
          setError('Unable to load products right now. Please try again later.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [searchQuery, activeCategory])

  const title = useMemo(() => {
    if (searchQuery) return `Results for "${searchQuery}"`
    if (activeCategory) return activeCategory
    return 'Featured Products'
  }, [searchQuery, activeCategory])

  const showViewAll = Boolean(searchQuery || activeCategory)

  const handleViewAll = () => {
    setActiveCategory('')
    navigate('/')
  }

  return (
    <div>
      <HeroSlider />

      <div className="scrollbar-hide flex gap-3 overflow-x-auto px-6 py-6">
        <button
          onClick={() => setActiveCategory('')}
          className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition ${
            activeCategory === ''
              ? 'bg-[#1D1D1F] text-white'
              : 'border border-[#D2D2D7] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const value = typeof cat === 'string' ? cat : cat.name
          return (
            <button
              key={value}
              onClick={() => setActiveCategory(value)}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition ${
                activeCategory === value
                  ? 'bg-[#1D1D1F] text-white'
                  : 'border border-[#D2D2D7] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]'
              }`}
            >
              {value}
            </button>
          )
        })}
      </div>

      <div id="products" className="mx-auto max-w-[1200px] px-12 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-[#1D1D1F]">{title}</h2>
          {showViewAll && (
            <button
              onClick={handleViewAll}
              className="text-sm font-medium text-[#0071E3] hover:underline"
            >
              View all
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-[#FF3B30]/10 px-4 py-3 text-sm text-[#FF3B30]">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D2D2D7] py-16 text-center">
            <p className="text-lg font-medium text-[#1D1D1F]">
              No products found
            </p>
            <p className="mt-1 text-sm text-[#6E6E73]">
              Try a different search term or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
