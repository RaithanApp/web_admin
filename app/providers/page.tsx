'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import { supabase, ProviderProfile, Business } from '@/lib/supabase'

type ProviderRow = ProviderProfile & {
  business: Business | null
  derivedStatus: string
}

const ROWS_OPTIONS = [10, 15, 25, 50]

const ALL_STATUSES = [
  { value: 'ALL', label: 'ALL' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'verification_required', label: 'Verification Required' },
  { value: 'otp_verified', label: 'Otp Verified' },
  { value: 'business_details_remaining', label: 'Business Details Remaining' },
]

function getDerivedStatus(profile: ProviderProfile, hasBusiness: boolean): string {
  const s = profile.status
  if (s === 'profile_pending') return 'otp_verified'
  if (!hasBusiness) return 'business_details_remaining'
  return s
}

export default function ProvidersPage() {
  const router = useRouter()
  const [rows, setRows] = useState<ProviderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: profiles, error: pErr } = await supabase
        .from('provider_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (pErr || !profiles) { setLoading(false); return }

      const userIds = profiles.map((p) => p.user_id)

      const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .in('user_id', userIds)

      const bizMap = Object.fromEntries(
        (businesses ?? []).map((b: Business) => [b.user_id, b])
      )

      const merged: ProviderRow[] = profiles.map((p: ProviderProfile) => {
        const biz = bizMap[p.user_id] ?? null
        return {
          ...p,
          business: biz,
          derivedStatus: getDerivedStatus(p, !!biz),
        }
      })

      setRows(merged)
      setLoading(false)
    }
    load()
  }, [])

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const matchSearch =
      !search ||
      (r.first_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.last_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.business?.mobile_number ?? '').includes(search)

    const matchStatus =
      statusFilter === 'ALL' || r.derivedStatus === statusFilter

    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  function handlePageChange(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages))
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-4 p-5 border-b border-gray-100">
            <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">
              Service Providers
            </span>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-green-50 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-5 font-medium text-gray-600 w-20">Profile Picture</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">First Name</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Last Name</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Mobile Number</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    <td className="py-4 px-5"><div className="w-9 h-9 rounded-full bg-gray-200" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24 mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24 mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-32 mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    No providers found.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/providers/${row.user_id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5">
                      {row.profile_image_url ? (
                        <Image
                          src={row.profile_image_url}
                          alt={`${row.first_name ?? ''} profile`}
                          width={36}
                          height={36}
                          className="rounded-full object-cover w-9 h-9"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
                          {(row.first_name?.[0] ?? '?').toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700">
                      {row.first_name ? (
                        row.first_name
                      ) : (
                        <span className="text-red-400">Not Provided</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700">
                      {row.last_name ? (
                        row.last_name
                      ) : (
                        <span className="text-red-400">Not Provided</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-500">
                      {row.business?.mobile_number ?? '—'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={row.derivedStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Footer: rows per page + pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
                className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none"
              >
                {ROWS_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="disabled:text-gray-300 hover:text-gray-700 transition-colors"
              >
                Prev
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="disabled:text-gray-300 hover:text-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}