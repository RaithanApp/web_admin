'use client';

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import StatusBadge from '@/components/StatusBadge'
import { supabase, Product } from '@/lib/supabase'

// Maps URL slug → product_type value stored in DB
const SLUG_TO_TYPE: Record<string, string> = {
  mechanics: 'Mechanics',
  'paddy-transplantors': 'Paddy Transplantors',
  drones: 'Drones',
  harvestors: 'Harvestors',
  'agriculture-labor': 'Agriculture Labor',
  'earth-movers': 'Earth Movers',
  implements: 'Implements',
  machines: 'Machines',
  technician: 'Technician',
}

const VERIFICATION_STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'reverification_required', label: 'Reverification Required' },
  { value: 'modification_required', label: 'Modification Required' },
]

function ImageSlot({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-32 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
        {src ? (
          <Image
            src={src}
            alt={label}
            width={128}
            height={96}
            className="object-cover w-full h-full"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <span className="text-xs text-gray-400">No image</span>
        )}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

function DocLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-600 hover:underline"
    >
      {label}
    </a>
  )
}

export default function CategoryProductsPage() {
  const { slug } = useParams<{ slug: string }>()
  const productType = SLUG_TO_TYPE[slug] ?? slug
  const title = productType

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)


    useEffect(() => {
    let ignore = false

    async function fetchProducts() {
        setLoading(true)

        const { data } = await supabase
        .from('products')
        .select('*')
        .eq('product_type', productType)
        .order('created_at', { ascending: false })

        if (!ignore) {
        setProducts(data ?? [])
        setLoading(false)
        }
    }

    fetchProducts()

    return () => {
        ignore = true
    }
    }, [productType])

  async function updateStatus(productId: string, newStatus: string) {
    setUpdating(productId)
    const { error } = await supabase
      .from('products')
      .update({ verification_status: newStatus })
      .eq('id', productId)

    if (!error) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, verification_status: newStatus } : p
        )
      )
    }
    setUpdating(null)
  }

  const filtered =
    filter === 'all'
      ? products
      : products.filter((p) => p.verification_status === filter)

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">{title}</h1>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
            ℹ Filter by Verification Status:
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-green-50 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]"
          >
            {VERIFICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Products */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-red-400 py-20 font-medium">No products found.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {filtered.map((product) => {
              const isUpdating = updating === product.id
              const isVerified = product.verification_status === 'verified'

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-5"
                >
                  {/* Product header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        🏷 Product Details
                      </p>
                      {product.model_no && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          ⚙ Model No: {product.model_no}
                        </p>
                      )}
                    </div>

                    {/* Action buttons — only shown for non-verified states */}
                    {!isVerified && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateStatus(product.id, 'verified')}
                          disabled={isUpdating}
                          className="border border-yellow-400 text-yellow-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => updateStatus(product.id, 'rejected')}
                          disabled={isUpdating}
                          className="border border-red-400 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateStatus(product.id, 'modification_required')}
                          disabled={isUpdating}
                          className="border border-yellow-500 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50"
                        >
                          Modification Required
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 text-sm">
                      {product.type && (
                        <p className="text-gray-600">
                          📋 Type: {product.type}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={product.verification_status} />
                      </div>
                      <p className="text-gray-600 flex items-center gap-1">
                        ⭐ Average Rating:{' '}
                        {product.avg_rating && product.avg_rating > 0
                          ? product.avg_rating
                          : 'N/A'}
                      </p>
                      {product.hp && (
                        <p className="text-gray-600">HP: {product.hp}</p>
                      )}
                      {product.is_individual !== undefined && (
                        <p className="text-gray-600">
                          {product.is_individual ? 'Individual' : `Workers: ${product.number_of_workers}`}
                        </p>
                      )}
                      {product.ready_to_travel && (
                        <p className="text-green-600 text-xs font-medium">✓ Ready to travel</p>
                      )}
                      {product.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.services.map((s) => (
                            <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Product images */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">📷 Product Images</p>
                      <div className="flex flex-wrap gap-3">
                        <ImageSlot src={product.image_front} label="Front View" />
                        <ImageSlot src={product.image_back} label="Back View" />
                        <ImageSlot src={product.image_left} label="Left View" />
                        <ImageSlot src={product.image_right} label="Right View" />
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  {(product.doc_driving_license ||
                    product.doc_rc_book ||
                    product.doc_bill ||
                    product.doc_e_shram_card) && (
                    <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-4 text-sm">
                      <p className="w-full text-xs font-medium text-gray-500 uppercase tracking-wide">Documents</p>
                      <DocLink href={product.doc_driving_license} label="Driving License" />
                      <DocLink href={product.doc_rc_book} label="RC Book" />
                      <DocLink href={product.doc_bill} label="Bill" />
                      <DocLink href={product.doc_e_shram_card} label="e-Shram Card" />
                      {product.e_shram_card_number && (
                        <span className="text-xs text-gray-500">
                          e-Shram No: {product.e_shram_card_number}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}