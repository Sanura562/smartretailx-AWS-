import { useCallback, useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/api'
import Toast from '../../components/Toast'
import Spinner from '../../components/Spinner'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  category: '',
  sku: '',
  image_url: '',
}

function ProductModal({ product, onClose, onSaved, onError }) {
  const [form, setForm] = useState(
    product
      ? {
          name: product.name ?? '',
          description: product.description ?? '',
          price: product.price ?? '',
          category: product.category ?? '',
          sku: product.sku ?? '',
          image_url: product.image_url ?? '',
        }
      : EMPTY_FORM,
  )
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(product)

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.sku.trim()) return

    setIsSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        category: form.category.trim(),
        sku: form.sku.trim(),
        image_url: form.image_url.trim(),
      }
      if (isEditing) {
        await updateProduct(product.id, payload)
      } else {
        await createProduct(payload)
      }
      onSaved(isEditing ? 'Product updated successfully.' : 'Product created successfully.')
    } catch {
      onError(isEditing ? 'Failed to update product.' : 'Failed to create product.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6E6E73] hover:bg-[#F5F5F7]"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">Product Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={handleChange('name')}
              className="w-full rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={handleChange('description')}
              className="w-full resize-none rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange('price')}
                className="w-full rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={handleChange('category')}
                className="w-full rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">SKU *</label>
            <input
              type="text"
              required
              value={form.sku}
              onChange={handleChange('sku')}
              className="w-full rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#1D1D1F]">Image URL</label>
            <input
              type="text"
              value={form.image_url}
              onChange={handleChange('image_url')}
              className="w-full rounded-lg border border-[#D2D2D7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D2D2D7] px-4 py-2 text-sm font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-[#0071E3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0077ED] disabled:opacity-60"
            >
              {isSaving && <Spinner className="h-4 w-4" />}
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ productName, onCancel, onConfirm, isDeleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F]">Delete Product</h2>
        <p className="mt-2 text-sm text-[#6E6E73]">
          Are you sure you want to delete <span className="font-medium text-[#1D1D1F]">{productName}</span>? This
          cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[#D2D2D7] px-4 py-2 text-sm font-medium text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-lg bg-[#FF3B30] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#E0352B] disabled:opacity-60"
          >
            {isDeleting && <Spinner className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalProduct, setModalProduct] = useState(undefined) // undefined = closed, null = new, object = edit
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const loadProducts = useCallback(() => {
    setIsLoading(true)
    setError('')
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : (data?.products ?? [])))
      .catch(() => setError('Unable to load products right now.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadProducts()
  }, [loadProducts])

  const handleSaved = (message) => {
    setModalProduct(undefined)
    setToast({ message, type: 'success' })
    loadProducts()
  }

  const handleModalError = (message) => {
    setToast({ message, type: 'error' })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteProduct(deleteTarget.id)
      setToast({ message: 'Product deleted successfully.', type: 'success' })
      setDeleteTarget(null)
      loadProducts()
    } catch {
      setToast({ message: 'Failed to delete product.', type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-[#1D1D1F]">Products</h1>
        <button
          onClick={() => setModalProduct(null)}
          className="rounded-lg bg-[#0071E3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0077ED]"
        >
          + Add Product
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        {error && (
          <div className="mb-4 rounded-lg bg-[#FF3B30]/10 px-4 py-3 text-sm text-[#FF3B30]">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-[#F5F5F7]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6E6E73]">No products yet. Add your first product.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8E8ED] text-[#6E6E73]">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Category</th>
                  <th className="py-3 pr-4 font-medium">Price</th>
                  <th className="py-3 pr-4 font-medium">SKU</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={product.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F7]'}>
                    <td className="py-3 pr-4 font-medium text-[#1D1D1F]">{product.name}</td>
                    <td className="py-3 pr-4 text-[#6E6E73]">{product.category || '—'}</td>
                    <td className="py-3 pr-4 text-[#1D1D1F]">${Number(product.price ?? 0).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-[#6E6E73]">{product.sku || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-block rounded-full bg-[#1D7A1D]/10 px-3 py-1 text-xs font-medium text-[#1D7A1D]">
                        Active
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModalProduct(product)}
                          className="rounded-lg border border-[#D2D2D7] px-3 py-1.5 text-xs font-medium text-[#1D1D1F] transition hover:bg-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="rounded-lg border border-[#FF3B30]/30 px-3 py-1.5 text-xs font-medium text-[#FF3B30] transition hover:bg-[#FF3B30]/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalProduct !== undefined && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(undefined)}
          onSaved={handleSaved}
          onError={handleModalError}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          productName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  )
}
