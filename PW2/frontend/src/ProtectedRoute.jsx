import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, logout, getUser } from './api'

const roleToDashboard = {
  staff: '/staff/dashboard',
  student: '/student/dashboard'
}

const ProtectedRoute = ({ children, redirectTo = '/', allowedRoles = null }) => {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [user, setUser] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const ok = isAuthenticated()
    if (!ok) {
      logout()
      setAuthed(false)
      setUser(null)
      setReady(true)
      return
    }
    const u = getUser()
    setUser(u)
    setAuthed(true)
    setReady(true)
  }, [location.pathname])

  if (!ready) return null

  if (!authed) {
    return <Navigate to={redirectTo} replace />
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    // if logged-in but wrong role, redirect to their dashboard if known
    const dest = (user && roleToDashboard[user.role]) || redirectTo
    return <Navigate to={dest} replace />
  }

  return children
}

export default ProtectedRoute