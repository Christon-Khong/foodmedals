'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UserRow = {
  id: string
  displayName: string
  email: string
  city: string | null
  isAdmin: boolean
  currentYearMedals: number
  totalMedals: number
  submissions: number
  createdAt: string
}

export function UsersTable({
  users: initialUsers,
  year,
  currentUserEmail,
}: {
  users: UserRow[]
  year: number
  currentUserEmail: string
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = initialUsers.filter((u) => {
    if (filter === 'admin') return u.isAdmin
    if (filter === 'user') return !u.isAdmin
    return true
  })

  async function toggleAdmin(userId: string, makeAdmin: boolean) {
    setBusy(userId)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin: makeAdmin }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error ?? 'Failed to update')
    }
    setBusy(null)
  }

  async function deleteUser(userId: string) {
    setBusy(userId)
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setConfirmDelete(null)
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error ?? 'Failed to delete')
    }
    setBusy(null)
  }

  const adminCount = initialUsers.filter((u) => u.isAdmin).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">
          {initialUsers.length} registered users &middot; {adminCount} admin{adminCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'admin', 'user'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? `All (${initialUsers.length})` : f === 'admin' ? `Admins (${adminCount})` : `Users (${initialUsers.length - adminCount})`}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">User</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold">Role</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell">City</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold">{year} Medals</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold hidden md:table-cell">Total</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold hidden lg:table-cell">Submissions</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden lg:table-cell">Joined</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map((u) => {
              const isSelf = u.email === currentUserEmail
              return (
                <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">
                      {u.displayName}
                      {isSelf && <span className="text-xs text-gray-500 ml-1.5">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => !isSelf && toggleAdmin(u.id, !u.isAdmin)}
                      disabled={busy === u.id || isSelf}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                        u.isAdmin
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-gray-800 text-gray-500 border border-gray-700'
                      } ${isSelf ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                      title={isSelf ? 'Cannot change your own role' : u.isAdmin ? 'Click to remove admin' : 'Click to make admin'}
                    >
                      {u.isAdmin ? 'Admin' : 'User'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{u.city ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${u.currentYearMedals > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
                      {u.currentYearMedals}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 hidden md:table-cell">{u.totalMedals}</td>
                  <td className="px-4 py-3 text-center text-gray-400 hidden lg:table-cell">{u.submissions}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!isSelf && (
                      confirmDelete === u.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={busy === u.id}
                            className="text-xs text-red-400 hover:text-red-300 font-medium"
                          >
                            {busy === u.id ? '...' : 'Yes'}
                          </button>
                          <span className="text-gray-600">/</span>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-400 hover:text-white font-medium"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(u.id)}
                          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                          title="Delete user"
                        >
                          Remove
                        </button>
                      )
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8 text-sm">No users match this filter.</p>
        )}
      </div>
    </div>
  )
}
