'use client'

import { useEffect, useState } from 'react'
import { supabase, Seeker } from '@/lib/supabase'

const ROWS_OPTIONS = [10, 15, 25, 50]

export default function SeekersPage() {
  const [seekers, setSeekers] = useState<Seeker[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('seekers')
        .select('*')
        .order('created_at', { ascending: false })
      setSeekers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = seekers.filter(
    (s) => !search || s.phone_number.includes(search)
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <div className="min-h-screen bg-gray-100">

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 p-5 border-b border-gray-100">
            <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">
              Service Seekers
            </span>
            <input
              type="text"
              placeholder="Search by contact number"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
            />
            {/* Status filter — seekers are all "verified" (OTP), kept for UI parity */}
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-green-50 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[120px]"
              defaultValue="All"
            >
              <option>All</option>
              <option>Verified</option>
            </select>
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-center py-3 px-4 font-medium text-gray-600">Mobile Number</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-36 mx-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-16 text-center text-gray-400">
                    No seekers found.
                  </td>
                </tr>
              ) : (
                paginated.map((seeker) => (
                  <tr key={seeker.id} className="border-b border-gray-50">
                    <td className="py-5 px-4 text-center text-gray-500">
                      {seeker.phone_number}
                    </td>
                    <td className="py-5 px-4 text-center">
                      {/* Seekers don't show a badge per spec — just show plain text */}
                      <span className="text-gray-600 text-sm">—</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
                className="border border-gray-200 rounded px-2 py-1 text-sm bg-green-50 focus:outline-none"
              >
                {ROWS_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="disabled:text-gray-300 hover:text-gray-700 transition-colors"
              >
                Prev
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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