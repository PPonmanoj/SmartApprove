import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, logout, getUser, getRoleFromToken } from './api'

const roleToDashboard = {
    staff: '/staff/dashboard',
    student: '/student/dashboard'
}

// ProtectedRoute: validates authentication and role-based access
// Role is read from JWT payload (getRoleFromToken), with fallback to localStorage user object
const ProtectedRoute = ({ children, redirectTo = '/', allowedRoles = null }) => {
    const [ready, setReady]   = useState(false)
    const [authed, setAuthed] = useState(false)
    const [role, setRole]     = useState(null)
    const [user, setUser]     = useState(null)
    const location = useLocation()

    useEffect(() => {
        const ok = isAuthenticated()
        if (!ok) {
            logout()
            setAuthed(false)
            setRole(null)
            setUser(null)
            setReady(true)
            return
        }
        
        // Try to get role from JWT token first
        let jwtRole = getRoleFromToken()
        
        // Fallback to localStorage user object if JWT role is not available
        const u = getUser()
        if (!jwtRole && u?.role) {
            jwtRole = u.role
        }
        
        setRole(jwtRole)
        setUser(u)
        setAuthed(true)
        setReady(true)
    }, [location.pathname])

    if (!ready) return null

    if (!authed) {
        return <Navigate to={redirectTo} replace />
    }

    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
        const dest = (role && roleToDashboard[role]) || redirectTo
        return <Navigate to={dest} replace />
    }

    return children
}

export default ProtectedRoute
