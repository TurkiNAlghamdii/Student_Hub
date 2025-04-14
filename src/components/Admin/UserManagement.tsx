'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { 
  ShieldCheckIcon, 
  ShieldExclamationIcon, 
  UserCircleIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface StudentProfile {
  full_name?: string
  student_id?: string
  faculty?: string
  email: string
}

interface UserWithMetadata extends User {
  student_profile?: StudentProfile | null
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithMetadata[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithMetadata[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(user => 
      user.student_profile?.full_name?.toLowerCase().includes(query) || 
      (user.student_profile?.student_id && String(user.student_profile.student_id).toLowerCase().includes(query)) ||
      user.email?.toLowerCase().includes(query)
    )
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      setFilteredUsers(data.users)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingUser(userId)
      console.log('Toggling admin status:', { userId, currentStatus, newStatus: !currentStatus })
      
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isAdmin: !currentStatus
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to update user')
      }

      const result = await response.json()
      console.log('Update result:', result)

      await fetchUsers() // Refresh the list
    } catch (err) {
      console.error('Error updating user:', err)
      setError('Failed to update user')
    } finally {
      setUpdatingUser(null)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingUser(userId)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isDisabled: !currentStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      await fetchUsers() // Refresh the list
    } catch (err) {
      console.error('Error updating user:', err)
      setError('Failed to update user')
    } finally {
      setUpdatingUser(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="dark:bg-gray-900/50 bg-white/80 backdrop-blur-sm rounded-2xl p-6 dark:border-gray-800/50 border-gray-200/70 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white text-gray-800">User Management</h2>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 dark:bg-emerald-500/10 bg-emerald-500/20 dark:text-emerald-400 text-emerald-600 rounded-lg hover:bg-emerald-500/20 transition-colors dark:border-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/30"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 dark:text-gray-400 text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full dark:bg-gray-800/70 bg-gray-100/70 backdrop-blur-sm dark:border-gray-700 border-gray-300 rounded-lg pl-10 pr-10 py-2 dark:text-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search by name, student ID or email..."
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XMarkIcon className="h-5 w-5 dark:text-gray-400 text-gray-500 dark:hover:text-white hover:text-gray-800" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm dark:text-gray-400 text-gray-600">
            Found {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} matching &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg dark:border-gray-800/60 border-gray-300/60">
        <table className="w-full">
          <thead>
            <tr className="text-left dark:bg-gray-800/50 bg-gray-200/70 backdrop-blur-sm">
              <th className="px-4 py-3 dark:text-gray-300 text-gray-700 font-medium text-sm">User</th>
              <th className="px-4 py-3 dark:text-gray-300 text-gray-700 font-medium text-sm">Email</th>
              <th className="px-4 py-3 dark:text-gray-300 text-gray-700 font-medium text-sm">Role</th>
              <th className="px-4 py-3 dark:text-gray-300 text-gray-700 font-medium text-sm">Status</th>
              <th className="px-4 py-3 dark:text-gray-300 text-gray-700 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800/50 divide-gray-300/50">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isAdmin = user.app_metadata?.is_admin === true || 
                              user.app_metadata?.is_admin === 'true' || 
                              String(user.app_metadata?.is_admin).toLowerCase() === 'true'
                const isDisabled = user.user_metadata?.is_disabled === true
                
                return (
                  <tr key={user.id} className="dark:hover:bg-gray-800/30 hover:bg-gray-200/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="dark:bg-gray-700/50 bg-gray-200/80 p-2 rounded-full">
                          <UserCircleIcon className="h-8 w-8 dark:text-emerald-400 text-emerald-600" />
                        </div>
                        <div>
                          <div className="dark:text-white text-gray-800 font-medium">
                            {user.student_profile?.full_name || 'No Name'}
                          </div>
                          {user.student_profile?.student_id && (
                            <div className="text-sm dark:text-gray-400 text-gray-600">
                              ID: {user.student_profile.student_id}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 dark:text-gray-300 text-gray-700">
                        <EnvelopeIcon className="h-5 w-5 dark:text-emerald-400/70 text-emerald-600/70" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ShieldExclamationIcon className="h-5 w-5 text-gray-500" />
                        )}
                        <span className={isAdmin ? 'text-emerald-500' : 'text-gray-400'}>
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {isDisabled ? (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                        )}
                        <span className={isDisabled ? 'text-red-500' : 'text-emerald-500'}>
                          {isDisabled ? 'Disabled' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAdminStatus(user.id, isAdmin)}
                          disabled={updatingUser === user.id}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors border ${
                            isAdmin 
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/30' 
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/30'
                          }`}
                        >
                          {updatingUser === user.id ? 'Updating...' : isAdmin ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, isDisabled)}
                          disabled={updatingUser === user.id}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors border ${
                            isDisabled 
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/30' 
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/30'
                          }`}
                        >
                          {updatingUser === user.id ? 'Updating...' : isDisabled ? 'Enable' : 'Disable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center dark:text-gray-400 text-gray-600">
                  {searchQuery ? (
                    <div>
                      <div>No users found matching your search.</div>
                      <button 
                        onClick={clearSearch}
                        className="mt-2 dark:text-emerald-400 text-emerald-600 dark:hover:text-emerald-300 hover:text-emerald-500 underline"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div>No users available.</div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}